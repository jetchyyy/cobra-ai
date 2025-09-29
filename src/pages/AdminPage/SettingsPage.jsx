import { Settings, Bell, Shield, Database, Mail, Globe, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">General Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Site Name</p>
                <p className="text-gray-400 text-sm">Configure your site name</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Time Zone</p>
                <p className="text-gray-400 text-sm">Current: UTC +0:00</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Language</p>
                <p className="text-gray-400 text-sm">English (US)</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-400 text-sm">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-gray-400 text-sm">Browser notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Activity Alerts</p>
                <p className="text-gray-400 text-sm">User activity notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-gray-400 text-sm">Add extra security layer</p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                Enable
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Session Timeout</p>
                <p className="text-gray-400 text-sm">Auto logout after 30 minutes</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Configure
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Password Policy</p>
                <p className="text-gray-400 text-sm">Minimum 8 characters</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-white">Database</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Backup Database</p>
                <p className="text-gray-400 text-sm">Create database backup</p>
              </div>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm">
                Backup
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Auto Backup</p>
                <p className="text-gray-400 text-sm">Schedule automatic backups</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Database Size</p>
                <p className="text-gray-400 text-sm">Current: 24.5 MB</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Optimize
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email & API Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Email Configuration</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <label className="text-white font-medium block mb-2">SMTP Server</label>
              <input 
                type="text" 
                placeholder="smtp.example.com" 
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <label className="text-white font-medium block mb-2">Port</label>
              <input 
                type="text" 
                placeholder="587" 
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Save Email Settings
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">API Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-white font-medium mb-2">API Key</p>
              <div className="flex items-center space-x-2">
                <input 
                  type="password" 
                  value="••••••••••••••••••••" 
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  Show
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Rate Limiting</p>
                <p className="text-gray-400 text-sm">100 requests per minute</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Edit
              </button>
            </div>
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
              Regenerate API Key
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-800 rounded-xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-semibold text-red-400">Danger Zone</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-red-800">
            <div>
              <p className="text-white font-medium">Clear All Data</p>
              <p className="text-gray-400 text-sm">Permanently delete all user data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
              Clear Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-red-800">
            <div>
              <p className="text-white font-medium">Reset to Defaults</p>
              <p className="text-gray-400 text-sm">Reset all settings to default values</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}