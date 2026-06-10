UPDATE t_p65890965_refstaff_project.blog_posts
SET content = regexp_replace(
    regexp_replace(content, '([а-яёА-ЯЁa-zA-Z])\?+([а-яёА-ЯЁa-zA-Z])', '\1\2', 'g'),
    '([а-яёА-ЯЁa-zA-Z])\?+([а-яёА-ЯЁa-zA-Z])', '\1\2', 'g'
)
WHERE content ~ '[а-яёА-ЯЁa-zA-Z]\?+[а-яёА-ЯЁa-zA-Z]';
