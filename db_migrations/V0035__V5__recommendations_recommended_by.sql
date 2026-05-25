-- recommendations: добавить recommended_by (алиас к recommender_id) и comment
ALTER TABLE t_p65890965_refstaff_project.recommendations
    ADD COLUMN IF NOT EXISTS recommended_by INTEGER REFERENCES t_p65890965_refstaff_project.users(id);

-- Скопировать данные из recommender_id в recommended_by (синхронизация)
UPDATE t_p65890965_refstaff_project.recommendations 
SET recommended_by = recommender_id 
WHERE recommended_by IS NULL AND recommender_id IS NOT NULL;
