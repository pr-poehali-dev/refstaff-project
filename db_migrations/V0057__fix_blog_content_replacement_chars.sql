UPDATE t_p65890965_refstaff_project.blog_posts
SET content = replace(content, E'\xef\xbf\xbd', '')
WHERE content LIKE '%' || E'\xef\xbf\xbd' || '%';