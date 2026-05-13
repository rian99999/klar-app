import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { Button, Card, PageHeader } from '../components/Ui.jsx'

export function MakeupHubPage() {
  const { state } = useAppData()
  const products = state.toneRecommendProducts
    .slice()
    .sort((a, b) => String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)))

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="메이크업 제품"
        subtitle="퍼스널컬러 톤과 카테고리 기준으로 추천 제품을 찾아보세요."
        right={
          <Link to="/admin">
            <Button variant="secondary" className="px-3 py-2 text-[11px]">
              Admin
            </Button>
          </Link>
        }
      />

      <Card className="border-klar-100 bg-white/80">
        <p className="text-xs leading-relaxed text-klar-600">
          상단 카테고리를 좌우로 넘겨 선택할 수 있고, 제품 카드는 2열로 노출됩니다.
          고객 결과지에서는 진단 톤에 맞는 제품만 자동으로 필터링됩니다.
        </p>
      </Card>

      <ProductCatalog
        products={products}
        categoryVisibility={state.productCategoryVisibility}
        emptyMessage="등록된 메이크업 추천 제품이 없습니다. 관리자 페이지에서 제품을 먼저 등록해 주세요."
      />
    </div>
  )
}
