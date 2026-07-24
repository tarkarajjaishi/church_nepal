'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Action = 'view' | 'create' | 'edit' | 'delete';

type Permission = {
  resource: string;
  actions: Record<Action, boolean>;
};

type Props = {
  initialPermissions?: Permission[];
  onSave: (permissions: Permission[]) => void;
  onCancel: () => void;
};

const PermissionsMatrix = ({ initialPermissions = [], onSave, onCancel }: Props) => {
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  // Define common resources and actions
  const resources = ['Users', 'Content', 'Events', 'Donations', 'Settings', 'Reports'];
  const actions: Action[] = ['view', 'create', 'edit', 'delete'];

  // Initialize permissions if they don't exist
  if (permissions.length === 0) {
    resources.forEach(resource => {
      const exists = permissions.some(p => p.resource === resource);
      if (!exists) {
        permissions.push({
          resource,
          actions: { view: false, create: false, edit: false, delete: false }
        });
      }
    });
  }

  const handleTogglePermission = (resourceIndex: number, action: Action) => {
    const updatedPermissions = [...permissions];
    updatedPermissions[resourceIndex].actions[action] = !updatedPermissions[resourceIndex].actions[action];
    setPermissions(updatedPermissions);
  };

  const handleSave = () => {
    onSave(permissions);
  };

  return (
    <Card className="bg-[var(--panel-2)] border border-[var(--border-soft)] p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-soft)]">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider w-40">Resource</th>
              {actions.map(action => (
                <th key={action} className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[80px]">
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {resources.map((resource, resourceIndex) => {
              const permIndex = permissions.findIndex(p => p.resource === resource);
              const perm = permIndex !== -1 ? permissions[permIndex] : { resource, actions: { view: false, create: false, edit: false, delete: false } };
              
              return (
                <tr key={resource}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{resource}</td>
                  {actions.map(action => (
                    <td key={`${resource}-${action}`} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions[action]}
                        onChange={() => handleTogglePermission(permIndex !== -1 ? permIndex : permissions.length, action)}
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Permissions</Button>
      </div>
    </Card>
  );
};

export default PermissionsMatrix;
