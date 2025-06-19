CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE widgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE themes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  css_code TEXT NOT NULL
);

CREATE TABLE widget_themes (
  widget_id INT,
  theme_id INT,
  PRIMARY KEY (widget_id, theme_id),
  FOREIGN KEY (widget_id) REFERENCES widgets(id),
  FOREIGN KEY (theme_id) REFERENCES themes(id)
);
