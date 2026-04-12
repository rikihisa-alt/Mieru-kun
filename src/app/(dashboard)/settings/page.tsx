export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">プロフィール</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                表示名
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="名前を入力"
              />
            </div>
            <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
              保存
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            危険な操作
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </p>
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            アカウントを削除
          </button>
        </div>
      </div>
    </div>
  );
}
