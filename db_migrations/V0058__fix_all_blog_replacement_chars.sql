UPDATE t_p65890965_refstaff_project.blog_posts
SET 
    meta_description = regexp_replace(meta_description, E'\xef\xbf\xbd', '', 'g'),
    title = regexp_replace(title, E'\xef\xbf\xbd', '', 'g'),
    content = regexp_replace(content, E'\xef\xbf\xbd', '', 'g')
WHERE 
    meta_description ~ E'\xef\xbf\xbd'
    OR title ~ E'\xef\xbf\xbd'
    OR content ~ E'\xef\xbf\xbd';