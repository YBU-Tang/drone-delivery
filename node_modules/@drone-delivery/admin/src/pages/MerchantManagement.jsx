import { Store, Star, Phone, MapPin } from 'lucide-react';
import useStore from '../hooks/useDrones';

export default function MerchantManagement() {
  const { merchants } = useStore();

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">商家管理</h2>
            <p className="text-gray-500">管理所有合作商家</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            添加商家
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchants.map((merchant) => (
          <div key={merchant.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Store className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{merchant.name}</h3>
                  <p className="text-xs text-gray-400">{merchant.id}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                merchant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {merchant.status === 'active' ? '营业中' : '休息中'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{merchant.rating} 评分</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{merchant.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{merchant.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="text-xs">{merchant.address}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between">
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                编辑
              </button>
              <button className="text-gray-600 hover:text-gray-800 text-sm">
                查看位置
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
