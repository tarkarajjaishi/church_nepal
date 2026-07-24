'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PermissionsMatrix from '@/components/admin/permissions-matrix';
import { Badge } from '@/components/ui/badge';

// Define types for our roles and permissions
type Permission = {
  resource: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean; // indicates if it's a predefined system role
};

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load initial data (in real app, fetch from API)
  useEffect(() => {
    // Mock data for demonstration
    const mockRoles: Role[] = [
      {
        id: 'role-1',
        name: 'Super Admin',
        description: 'Full access to everything',
        system: true,
        permissions: [],
      },
      {
        id: 'role-2',
        name: 'Editor',
        description: 'Can manage content',
        system: true,
        permissions: [],
      },
      {
        id: 'role-3',
        name: 'Custom Role',
        description: 'Custom permissions defined by admin',
        system: false,
        permissions: [
          {
            resource: 'Users',
            actions: { view: true, create: true, edit: false, delete: false }
          },
          {
            resource: 'Content',
            actions: { view: true, create: true, edit: true, delete: false }
          }
        ]
      }
    ];
    setRoles(mockRoles);
  }, []);

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      description: newRoleDescription || 'Custom role',
      permissions: [],
      system: false,
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setIsCreating(false);
  };

  const handleSavePermissions = (roleId: string, updatedPermissions: Permission[]) => {
    setRoles(roles.map(role => 
      role.id === roleId ? { ...role, permissions: updatedPermissions } : role
    ));
    setEditingRoleId(null);
  };

  const assignRoleToAdmin = (adminId: string, roleId: string) => {
    // In a real app, this would make an API call to assign the role
    console.log(`Assigned role ${roleId} to admin ${adminId}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Roles</h1>
        <Button onClick={() => setIsCreating(true)}>Create New Role</Button>
      </div>

      {/* Create New Role Form */}
      {isCreating && (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Create New Role</h2>
          <Input
            placeholder="Role Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="mb-3"
          />
          <Input
            placeholder="Description (optional)"
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreateRole}>Save Role</Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Roles List */}
      <div className="space-y-6">
        {roles.map((role) => (
          <Card key={role.id} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{role.name}</h2>
                  {role.system && <Badge variant="secondary">System</Badge>}
                </div>
                <p className="text-sm text-[var(--muted)] mt-1">{role.description}</p>
              </div>
              
              {!role.system && (
                <div className="flex gap-2">
                  {editingRoleId === role.id ? (
                    <>
                      <Button size="sm" onClick={() => setEditingRoleId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingRoleId(role.id)}
                    >
                      Edit Permissions
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Permissions Matrix */}
            {editingRoleId === role.id && (
              <div className="mt-4">
                <PermissionsMatrix 
                  initialPermissions={role.permissions}
                  onSave={(updatedPermissions) => handleSavePermissions(role.id, updatedPermissions)}
                  onCancel={() => setEditingRoleId(null)}
                />
              </div>
            )}
            
            {/* Show current permissions summary when not editing */}
            {editingRoleId !== role.id && role.permissions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Current Permissions:</h3>
                <ul className="text-sm space-y-1">
                  {role.permissions.map((perm, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{perm.resource}</span>
                      <span>
                        {perm.actions.view && 'V'} 
                        {perm.actions.create && 'C'} 
                        {perm.actions.edit && 'E'} 
                        {perm.actions.delete && 'D'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RolesPage;
