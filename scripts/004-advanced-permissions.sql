-- Create roles and permissions tables
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- 'patients', 'pcs_entries', 'comments', etc.
    action VARCHAR(20) NOT NULL, -- 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role_id UUID REFERENCES user_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (name, description) VALUES
('admin', 'Administrador com acesso total ao sistema'),
('dentist', 'Dentista com acesso completo aos pacientes'),
('assistant', 'Assistente com acesso limitado'),
('receptionist', 'Recepcionista com acesso básico')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- Patient permissions
('patients.create', 'Criar novos pacientes', 'patients', 'create'),
('patients.read', 'Visualizar pacientes', 'patients', 'read'),
('patients.update', 'Editar informações de pacientes', 'patients', 'update'),
('patients.delete', 'Excluir pacientes', 'patients', 'delete'),

-- PCS permissions
('pcs.create', 'Criar entradas PCS', 'pcs_entries', 'create'),
('pcs.read', 'Visualizar PCS', 'pcs_entries', 'read'),
('pcs.update', 'Editar entradas PCS', 'pcs_entries', 'update'),
('pcs.delete', 'Excluir entradas PCS', 'pcs_entries', 'delete'),

-- Comments permissions
('comments.create', 'Adicionar comentários', 'patient_comments', 'create'),
('comments.read', 'Visualizar comentários', 'patient_comments', 'read'),
('comments.update', 'Editar comentários próprios', 'patient_comments', 'update'),
('comments.delete', 'Excluir comentários', 'patient_comments', 'delete'),

-- Reports permissions
('reports.generate', 'Gerar relatórios PDF', 'reports', 'create'),
('reports.view', 'Visualizar relatórios', 'reports', 'read'),

-- Admin permissions
('users.manage', 'Gerenciar usuários e permissões', 'users', 'create'),
('system.configure', 'Configurar sistema', 'system', 'update')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
    admin_role_id UUID;
    dentist_role_id UUID;
    assistant_role_id UUID;
    receptionist_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
    SELECT id INTO dentist_role_id FROM user_roles WHERE name = 'dentist';
    SELECT id INTO assistant_role_id FROM user_roles WHERE name = 'assistant';
    SELECT id INTO receptionist_role_id FROM user_roles WHERE name = 'receptionist';
    
    -- Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;
    
    -- Dentist permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT dentist_role_id, id FROM permissions 
    WHERE name IN (
        'patients.create', 'patients.read', 'patients.update',
        'pcs.create', 'pcs.read', 'pcs.update', 'pcs.delete',
        'comments.create', 'comments.read', 'comments.update',
        'reports.generate', 'reports.view'
    )
    ON CONFLICT DO NOTHING;
    
    -- Assistant permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT assistant_role_id, id FROM permissions 
    WHERE name IN (
        'patients.read', 'patients.update',
        'pcs.read', 'pcs.update',
        'comments.create', 'comments.read',
        'reports.view'
    )
    ON CONFLICT DO NOTHING;
    
    -- Receptionist permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT receptionist_role_id, id FROM permissions 
    WHERE name IN (
        'patients.create', 'patients.read', 'patients.update',
        'comments.read'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM user_profiles up
        JOIN role_permissions rp ON up.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE up.id = user_id 
        AND p.name = permission_name
        AND up.is_active = TRUE
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies with permission checks
DROP POLICY IF EXISTS "Users can view patients based on permissions" ON patients;
CREATE POLICY "Users can view patients based on permissions" ON patients
    FOR SELECT USING (
        check_user_permission(auth.uid(), 'patients.read')
    );

DROP POLICY IF EXISTS "Users can insert patients based on permissions" ON patients;
CREATE POLICY "Users can insert patients based on permissions" ON patients
    FOR INSERT WITH CHECK (
        check_user_permission(auth.uid(), 'patients.create')
    );

DROP POLICY IF EXISTS "Users can update patients based on permissions" ON patients;
CREATE POLICY "Users can update patients based on permissions" ON patients
    FOR UPDATE USING (
        check_user_permission(auth.uid(), 'patients.update')
    );

DROP POLICY IF EXISTS "Users can delete patients based on permissions" ON patients;
CREATE POLICY "Users can delete patients based on permissions" ON patients
    FOR DELETE USING (
        check_user_permission(auth.uid(), 'patients.delete')
    );

-- Update triggers for user profiles
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_profile_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
