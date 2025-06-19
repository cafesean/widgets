document.addEventListener('DOMContentLoaded', () => {
    console.log('Widget Designer & Library App Loaded');

    const widgetListContainer = document.querySelector('.widget-list');
    const canvas = document.getElementById('widget-canvas');
    const toolbarButtons = document.querySelectorAll('.toolbar button');
    const propertiesForm = document.getElementById('properties-form');
    const saveWidgetButton = document.getElementById('save-widget');
    const previewCodeButton = document.getElementById('preview-code-button');
    const widgetPreviewIframe = document.getElementById('widget-preview-iframe');
    const deleteSelectedElementButton = document.getElementById('delete-selected-element');
    const themeSelectDropdown = document.getElementById('theme-select-dropdown');
    const themeDescriptionElement = document.querySelector('.theme-selector .theme-description');

    let availableThemes = [];
    let aceEditor;
    const codeEditorDiv = document.getElementById('widget-code-editor');

    if (codeEditorDiv) {
        aceEditor = ace.edit("widget-code-editor");
        aceEditor.setTheme("ace/theme/monokai");
        aceEditor.session.setMode("ace/mode/html");
        aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            fontSize: "14px"
        });
    } else {
        console.error("Ace Editor div not found!");
    }

    if (propertiesForm) {
        propertiesForm.innerHTML = '<p>Select an element on the canvas to edit its properties.</p>';
    }
    if (deleteSelectedElementButton) {
        deleteSelectedElementButton.disabled = true;
    }
    if (themeDescriptionElement) {
        themeDescriptionElement.textContent = 'Select a theme to see its description.';
    }

    function loadWidgets() {
        if (widgetListContainer) {
            widgetListContainer.innerHTML = '<p>Loading widgets...</p>';
            fetch('/api/widgets')
                .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
                .then(data => {
                    widgetListContainer.innerHTML = '';
                    if (data.widgets && data.widgets.length > 0) {
                        const ul = document.createElement('ul');
                        data.widgets.forEach(widget => {
                            const li = document.createElement('li');
                            li.textContent = `ID: ${widget.id}, Name: ${widget.name}, UserID: ${widget.user_id}`;
                            const loadButton = document.createElement('button');
                            loadButton.textContent = 'Load to Designer';
                            loadButton.onclick = () => loadWidgetToDesigner(widget.id);
                            li.appendChild(loadButton);
                            ul.appendChild(li);
                        });
                        widgetListContainer.appendChild(ul);
                    } else {
                        widgetListContainer.innerHTML = '<p>No widgets found. Create one below!</p>';
                    }
                })
                .catch(error => { console.error('Error fetching widgets:', error); widgetListContainer.innerHTML = `<p>Error loading widgets: ${error.message}.</p>`; });
        }
    }

    function loadThemes() {
        if (!themeSelectDropdown) return;
        fetch('/api/themes')
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(data => {
                availableThemes = data.themes || [];
                themeSelectDropdown.innerHTML = '<option value="">None</option>';
                if (availableThemes.length > 0) {
                    availableThemes.forEach(theme => {
                        const option = document.createElement('option');
                        option.value = theme.id;
                        option.textContent = theme.name;
                        themeSelectDropdown.appendChild(option);
                    });
                } else {
                    themeSelectDropdown.innerHTML = '<option value="">No themes available</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching themes:', error);
                if (themeDescriptionElement) themeDescriptionElement.textContent = 'Could not load themes.';
            });
    }

    if (themeSelectDropdown) {
        themeSelectDropdown.addEventListener('change', (event) => {
            const selectedThemeId = event.target.value;
            applyThemeToPreview(selectedThemeId);
        });
    }

    function applyThemeToPreview(themeId) {
        let themeCss = '';
        let themeToApply = null;
        if (themeDescriptionElement) themeDescriptionElement.textContent = '';

        if (themeId && themeId !== "") {
            themeToApply = availableThemes.find(t => t.id == themeId);
            if (themeToApply) {
                fetch(`/api/themes/${themeId}`)
                    .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
                    .then(fullTheme => {
                        themeCss = fullTheme.css_code || '';
                        if (themeDescriptionElement) themeDescriptionElement.textContent = fullTheme.description || 'No description.';
                        renderPreviewWithTheme(themeCss);
                    })
                    .catch(error => {
                        console.error(`Error fetching theme ${themeId} details:`, error);
                        if (themeDescriptionElement) themeDescriptionElement.textContent = 'Could not load theme details.';
                        renderPreviewWithTheme('');
                    });
            } else {
                 if (themeDescriptionElement) themeDescriptionElement.textContent = 'Selected theme not found.';
                 renderPreviewWithTheme('');
            }
        } else {
            if (themeDescriptionElement) themeDescriptionElement.textContent = 'No theme selected.';
            renderPreviewWithTheme('');
        }
    }

    function renderPreviewWithTheme(themeCss) {
        if (!widgetPreviewIframe || !aceEditor) return;
        const widgetHtml = aceEditor.getValue();
        const fullHtml = `
            <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Widget Preview</title><style>body { margin: 0; padding: 10px; font-family: sans-serif; } ${themeCss}</style></head>
            <body>${widgetHtml}</body></html>`;
        widgetPreviewIframe.srcdoc = fullHtml;
        console.log("Rendered code to preview iframe with selected theme's CSS.");
    }

    if (previewCodeButton && widgetPreviewIframe && aceEditor) {
        previewCodeButton.addEventListener('click', () => {
            const selectedThemeId = themeSelectDropdown ? themeSelectDropdown.value : "";
            applyThemeToPreview(selectedThemeId);
            alert("Code rendered to preview iframe with selected theme (if any).");
        });
    }

    function loadWidgetToDesigner(widgetId) {
        let loadedWidgetData = null;

        fetch(`/api/widgets/${widgetId}`)
            .then(response => {
                if (!response.ok) throw new Error(`Fetch Widget Error: ${response.statusText}`);
                return response.json();
            })
            .then(widget => {
                loadedWidgetData = widget;
                if (aceEditor) aceEditor.setValue(widget.code || '', -1);
                if (canvas) canvas.innerHTML = `<p>Widget "${widget.name}" code loaded. Design on canvas or preview with theme.</p>`;

                if (propertiesForm) propertiesForm.innerHTML = '<p>Select an element on the canvas to edit its properties.</p>';
                if (selectedCanvasElement) {
                    selectedCanvasElement.classList.remove('selected-element');
                    selectedCanvasElement.style.outline = 'none';
                    selectedCanvasElement = null;
                }
                if (deleteSelectedElementButton) deleteSelectedElementButton.disabled = true;

                document.getElementById('designer').scrollIntoView({ behavior: 'smooth' });
                return fetch(`/api/widgets/${widgetId}/themes`);
            })
            .then(themeResponse => {
                if (!themeResponse.ok) throw new Error(`Fetch Widget Themes Error: ${themeResponse.statusText}`);
                return themeResponse.json();
            })
            .then(associatedThemesData => {
                let themeToApplyId = "";
                if (associatedThemesData.themes && associatedThemesData.themes.length > 0) {
                    themeToApplyId = associatedThemesData.themes[0].id.toString();
                    console.log(`Widget ${widgetId} is associated with theme ID: ${themeToApplyId}`);
                } else {
                    console.log(`Widget ${widgetId} has no associated themes.`);
                }

                if (themeSelectDropdown) {
                    themeSelectDropdown.value = themeToApplyId;
                }
                applyThemeToPreview(themeToApplyId);

                alert(`Widget "${loadedWidgetData.name}" loaded. Associated theme (if any) applied to preview.`);
            })
            .catch(error => {
                console.error('Error loading widget or its themes:', error);
                alert(`Error loading widget: ${error.message}`);
                if (themeSelectDropdown) themeSelectDropdown.value = "";
                applyThemeToPreview("");
            });
    }

    let selectedCanvasElement = null;
    function selectElementForProperties(element) {
        if (selectedCanvasElement) { selectedCanvasElement.classList.remove('selected-element'); selectedCanvasElement.style.outline = 'none'; }
        selectedCanvasElement = element;
        selectedCanvasElement.classList.add('selected-element');
        selectedCanvasElement.style.outline = '2px solid blue';
        if (propertiesForm) renderPropertiesEditor(selectedCanvasElement);
        if (deleteSelectedElementButton) deleteSelectedElementButton.disabled = false;
    }

    function renderPropertiesEditor(element) {
        propertiesForm.innerHTML = '';
        const elType = element.tagName.toLowerCase();
        let form = `<h4>Edit ${elType}</h4><div><label for="prop-id">ID:</label><input type="text" id="prop-id" value="${element.id||''}"></div><div><label for="prop-class">Class:</label><input type="text" id="prop-class" value="${element.className||''}"></div>`;
        if (['button','label','p','h1','h2','h3'].includes(elType)) form += `<div><label for="prop-textContent">Text:</label><input type="text" id="prop-textContent" value="${element.textContent||''}"></div>`;
        else if (elType === 'input') form += `<div><label for="prop-value">Value:</label><input type="text" id="prop-value" value="${element.value||''}"></div><div><label for="prop-placeholder">Placeholder:</label><input type="text" id="prop-placeholder" value="${element.placeholder||''}"></div><div><label for="prop-type">Type:</label><input type="text" id="prop-type" value="${element.type||'text'}"></div>`;
        propertiesForm.innerHTML = form;
        propertiesForm.querySelectorAll('input').forEach(i => i.addEventListener('input', (e) => applyPropertyChange(element, e.target.id, e.target.value)));
    }

    function applyPropertyChange(element, propId, value) {
        if (propId === 'prop-id') element.id = value;
        else if (propId === 'prop-class') element.className = value;
        else if (propId === 'prop-textContent') element.textContent = value;
        else if (propId === 'prop-value') element.value = value;
        else if (propId === 'prop-placeholder') element.placeholder = value;
        else if (propId === 'prop-type' && element.tagName.toLowerCase()==='input') element.type = value;
        updateCodeViewFromCanvas();
    }

    if (canvas) {
        toolbarButtons.forEach(b => { b.setAttribute('draggable','true'); b.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', b.dataset.type)); });
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
            e.preventDefault(); const type = e.dataTransfer.getData('text/plain'); let newEl;
            if (canvas.innerHTML.includes("<p>Drag elements")) canvas.innerHTML = '';
            if (type==='button') {newEl=document.createElement('button'); newEl.textContent='New Button';}
            else if (type==='text') {newEl=document.createElement('input'); newEl.type='text'; newEl.placeholder='New Text Input';}
            else if (type==='label') {newEl=document.createElement('label'); newEl.textContent='New Label';}
            else {newEl=document.createElement('div'); newEl.textContent=`Element: ${type}`;}
            newEl.style.margin='5px'; newEl.setAttribute('draggable','true');
            newEl.addEventListener('dragstart',(ev)=>ev.stopPropagation());
            newEl.addEventListener('click',(ev)=>{ev.stopPropagation(); selectElementForProperties(newEl);});
            canvas.appendChild(newEl); selectElementForProperties(newEl); updateCodeViewFromCanvas();
        });
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas && selectedCanvasElement) {
                selectedCanvasElement.classList.remove('selected-element'); selectedCanvasElement.style.outline = 'none'; selectedCanvasElement = null;
                if (propertiesForm) propertiesForm.innerHTML = '<p>Select an element on the canvas to edit its properties.</p>';
                if (deleteSelectedElementButton) deleteSelectedElementButton.disabled = true;
            }
        });
    }

    if (deleteSelectedElementButton) {
        deleteSelectedElementButton.addEventListener('click', () => {
            if (selectedCanvasElement && confirm("Delete selected element?")) {
                selectedCanvasElement.remove(); selectedCanvasElement = null;
                if (propertiesForm) propertiesForm.innerHTML = '<p>Select an element on the canvas to edit its properties.</p>';
                updateCodeViewFromCanvas(); deleteSelectedElementButton.disabled = true;
            } else if (!selectedCanvasElement) alert("No element selected.");
        });
    }

    function updateCodeViewFromCanvas() {
        if (!canvas || !aceEditor) return; let html = '';
        Array.from(canvas.children).forEach(child => {
            const clone = child.cloneNode(true); clone.classList.remove('selected-element'); clone.style.outline = '';
            html += clone.outerHTML + '\n';
        });
        aceEditor.setValue(html.trim(), -1);
    }

    if (saveWidgetButton) {
        saveWidgetButton.addEventListener('click', () => {
            const widgetName = prompt("Enter widget name (or leave blank to use 'My Widget'):", "My Widget") || "My Widget";
            const widgetCode = aceEditor ? aceEditor.getValue() : '';

            if (!widgetCode.trim()) {
                alert("Widget code cannot be empty.");
                return;
            }
            const userIdStr = prompt("Enter User ID (numeric, e.g., 1):");
            if (!userIdStr || !/^\d+$/.test(userIdStr)) {
                alert("Valid User ID is required.");
                return;
            }
            const userId = parseInt(userIdStr, 10);
            const description = prompt("Enter widget description (optional):") || "";

        let savedWidgetId = null;

        fetch('/api/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: widgetName, code: widgetCode, user_id: userId, description: description }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(`Save Widget Error: ${err.message || 'Unknown error'}`) });
            }
            return response.json();
        })
        .then(data => {
            savedWidgetId = data.widget_id;
            console.log('Widget saved:', data);
            alert(`Widget saved! ID: ${savedWidgetId}. Refreshing widget list.`);

            const selectedThemeId = themeSelectDropdown ? themeSelectDropdown.value : "";
            if (selectedThemeId && selectedThemeId !== "" && savedWidgetId) {
                return fetch(`/api/widgets/${savedWidgetId}/themes/${selectedThemeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(themeResponse => {
                    if (!themeResponse.ok) {
                        return themeResponse.json().then(err => { throw new Error(`Theme Association Error: ${err.message || 'Unknown error'}`) });
                    }
                    return themeResponse.json();
                })
                .then(themeAssocData => {
                    console.log('Theme associated:', themeAssocData.message);
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            loadWidgets();
            if(aceEditor) aceEditor.setValue('', -1);
            if(canvas) canvas.innerHTML = '<p>Drag elements from the toolbar and drop them here.</p>';
            if (propertiesForm) propertiesForm.innerHTML = '<p>Select an element on the canvas to edit its properties.</p>';
            if (deleteSelectedElementButton) deleteSelectedElementButton.disabled = true;
            selectedCanvasElement = null;

            if (themeSelectDropdown) themeSelectDropdown.value = "";
            if (themeDescriptionElement) themeDescriptionElement.textContent = 'Select a theme to see its description.';
            if (widgetPreviewIframe) widgetPreviewIframe.srcdoc = '';
        })
        .catch((error) => {
            console.error('Error in save process:', error);
            alert(`Error during save: ${error.message}.`);
        });
    });
}

    loadWidgets();
    loadThemes();
});
