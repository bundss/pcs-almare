-- Insert sample patients
INSERT INTO patients (name, status, club_member, club_join_date) VALUES
('Maria Silva Santos', 'active', true, '2024-01-15'),
('João Pedro Oliveira', 'active', false, null),
('Ana Carolina Ferreira', 'active', true, '2024-02-20'),
('Carlos Eduardo Lima', 'inactive', false, null),
('Fernanda Costa Alves', 'active', true, '2024-03-10');

-- Get patient IDs for sample data
DO $$
DECLARE
    maria_id UUID;
    joao_id UUID;
    ana_id UUID;
BEGIN
    -- Get patient IDs
    SELECT id INTO maria_id FROM patients WHERE name = 'Maria Silva Santos';
    SELECT id INTO joao_id FROM patients WHERE name = 'João Pedro Oliveira';
    SELECT id INTO ana_id FROM patients WHERE name = 'Ana Carolina Ferreira';
    
    -- Insert sample PCS entries for Maria
    INSERT INTO pcs_entries (patient_id, title, description, category, order_index) VALUES
    (maria_id, 'Tratamento de Canal', 'Endodontia no dente 16 - urgente', 'fundamental', 0),
    (maria_id, 'Restauração Classe II', 'Restauração em resina composta no dente 25', 'fundamental', 1),
    (maria_id, 'Limpeza Periodontal', 'Raspagem e alisamento radicular', 'important', 0),
    (maria_id, 'Clareamento Dental', 'Clareamento caseiro supervisionado', 'care', 0);
    
    -- Insert sample PCS entries for João
    INSERT INTO pcs_entries (patient_id, title, description, category, order_index) VALUES
    (joao_id, 'Extração Dente do Siso', 'Remoção do terceiro molar inferior direito', 'fundamental', 0),
    (joao_id, 'Prótese Parcial', 'Confecção de PPR superior', 'important', 0),
    (joao_id, 'Orientação de Higiene', 'Instrução de técnica de escovação', 'care', 0);
    
    -- Insert sample PCS entries for Ana
    INSERT INTO pcs_entries (patient_id, title, description, category, order_index) VALUES
    (ana_id, 'Implante Dentário', 'Implante na região do dente 46', 'fundamental', 0),
    (ana_id, 'Coroa Protética', 'Coroa em porcelana sobre implante', 'important', 0),
    (ana_id, 'Manutenção Preventiva', 'Consulta de acompanhamento trimestral', 'care', 0);
    
    -- Insert sample comments
    INSERT INTO patient_comments (patient_id, content, author_name) VALUES
    (maria_id, 'Paciente apresentou sensibilidade durante o exame. Recomendado uso de dessensibilizante.', 'Dr. Silva'),
    (maria_id, 'Tratamento de canal iniciado. Paciente tolerou bem o procedimento.', 'Dr. Silva'),
    (joao_id, 'Paciente ansioso. Considerar sedação para próximos procedimentos.', 'Dra. Santos'),
    (ana_id, 'Excelente higiene oral. Paciente muito colaborativa.', 'Dr. Silva');
    
    -- Insert sample patient relationships
    INSERT INTO patient_relationships (patient_id, related_patient_id, relationship_type) VALUES
    (maria_id, ana_id, 'mother'),
    (ana_id, maria_id, 'daughter');
    
END $$;
