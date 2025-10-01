"use client"

const TopList = ({ isEvm }: { isEvm: boolean }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      {isEvm ? "Đại lý hàng đầu" : "Xe bán chạy"}
    </h3>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">{i}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {isEvm ? `Đại lý ${i}` : `Model EV-${i}`}
            </span>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {45 - i * 5} xe
          </span>
        </div>
      ))}
    </div>
  </div>
)

export default TopList
