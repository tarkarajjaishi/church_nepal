'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';

const BroadcastPage = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [channel, setChannel] = useState(['email', 'in_app']);
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [history, setHistory] = useState([
    { id: 1, subject: 'System Maintenance', sent: 120, opened: 85, date: '2026-07-15' },
    { id: 2, subject: 'New Feature Release', sent: 120, opened: 92, date: '2026-07-10' },
    { id: 3, subject: 'Security Update', sent: 120, opened: 78, date: '2026-07-01' }
  ]);
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleSubmit = () => {
    setOpenConfirm(true);
  };

  const confirmSend = () => {
    // Simulate sending
    const newBroadcast = {
      id: history.length + 1,
      subject,
      sent: 120, // Placeholder count
      opened: 0, // Initially zero
      date: new Date().toISOString().split('T')[0]
    };
    setHistory([newBroadcast, ...history]);
    setSubject('');
    setBody('');
    setSchedule(false);
    setScheduleDate('');
    setOpenConfirm(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Broadcast Center</h1>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Compose Message</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter broadcast subject"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={6}
              className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-[var(--text)]"
              >
                <option value="all">All Churches</option>
                <option value="free">Free Plan Only</option>
                <option value="pro">Pro Plan Only</option>
                <option value="premium">Premium Plan Only</option>
                <option value="active">Active Churches</option>
                <option value="suspended">Suspended Churches</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Channel</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={channel.includes('email')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannel([...channel, 'email']);
                      } else {
                        setChannel(channel.filter(c => c !== 'email'));
                      }
                    }}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={channel.includes('in_app')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannel([...channel, 'in_app']);
                      } else {
                        setChannel(channel.filter(c => c !== 'in_app'));
                      }
                    }}
                    className="mr-2"
                  />
                  In-App
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center mr-4">
              <input
                type="checkbox"
                checked={schedule}
                onChange={(e) => setSchedule(e.target.checked)}
                className="mr-2"
              />
              Schedule for later
            </label>
            {schedule && (
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="p-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-[var(--text)]"
              />
            )}
          </div>

          <div className="pt-4">
            <Button onClick={handleSubmit}>
              {schedule ? 'Schedule Broadcast' : 'Send Now'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Broadcast History</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Sent</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Opened</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{item.subject}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.sent}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={item.opened > item.sent * 0.7 ? 'default' : 'secondary'}>
                      {Math.round((item.opened / item.sent) * 100)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Confirm Broadcast"
        description={`Are you sure you want to send this message to ${audience === 'all' ? 'all churches' : audience} via ${channel.join(' and ')}?`}
        onConfirm={confirmSend}
      />
    </div>
  );
};

export default BroadcastPage;
