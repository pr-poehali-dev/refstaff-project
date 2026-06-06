CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.blog_posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    meta_description VARCHAR(500),
    content TEXT NOT NULL,
    topic VARCHAR(500) NOT NULL,
    published_at TIMESTAMP DEFAULT NOW(),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON t_p65890965_refstaff_project.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON t_p65890965_refstaff_project.blog_posts(is_published, published_at DESC);
