import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { Button, PageHeader } from '../components/Ui.jsx'

export function MakeupHubPage() {
  const { state } = useAppData()

  const products = useMemo(
    () =>
      state.toneRecommendProducts
        .slice()
        .sort((a, b) =>
          String(b.updatedAt ?? b.createdAt).localeCompare(
            String(a.updatedAt ?? a.createdAt),
          ),
        ),
    [state.toneRecommendProducts],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Product Library"
        title="메이크업 제품"
        subtitle="퍼스널컬러 톤과 카테고리로 추천 제품을 찾아보세요. 고객 결과지에는 진단 톤에 맞는 제품만 노출됩니다."
        right={
          <Link to="/admin">
            <Button variant="secondary" size="sm" icon="shield">
              관리
            </Button>
          </Link>
        }
      />

      <ProductCatalog
        products={products}
        categoryVisibility={state.productCategoryVisibility}
        searchable
        emptyMessage="등록된 추천 제품이 없습니다"
      />
    </div>
  )
}
