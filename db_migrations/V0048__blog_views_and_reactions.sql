
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.blog_post_views (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, session_id)
);

CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.blog_post_reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  emoji VARCHAR(8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, session_id)
);
