import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Download, Filter, Calendar } from 'lucide-react'
import { supabase } from '../../contexts/AuthContext'
import { useAuth } from '../../contexts/AuthContext'

interface PlanFactRevenueData {
  id: string
  organization_name: string
  parent_organization_id: string | null
  plan_amount: number
  fact_amount: number
  execution_percent: number
  period_type: 'month' | 'year'
  level: number
  is_total_row: boolean
  is_expandable: boolean
  children?: PlanFactRevenueData[]
  expanded?: boolean
}

const PlanFactRevenueReport: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<PlanFactRevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  // Helper function to generate UUID v4
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) {
      loadSampleData()
    }
  }, [user, reportDate])

  const loadSampleData = async () => {
    setLoading(true)
    
    try {
      const { data: existingData, error } = await supabase
        .from('plan_fact_revenue_reports')
        .select('*')
        .eq('user_id', user?.id)
        .eq('report_date', reportDate)
        .order('level')
        .order('organization_name')

      if (error) throw error

      if (existingData && existingData.length > 0) {
        const hierarchyData = buildHierarchy(existingData)
        setData(hierarchyData)
        // Set initial expanded rows for loaded data
        const initialExpanded = new Set<string>()
        existingData.forEach(item => {
          if (item.level <= 2) {
            initialExpanded.add(item.id)
          }
        })
        setExpandedRows(initialExpanded)
      } else {
        // Создаем демо-данные если их нет
        await createSampleData()
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // Показываем демо-данные в случае ошибки
      const sampleData = getSampleData()
      setData(sampleData)
      // Set initial expanded rows for sample data
      const initialExpanded = new Set<string>()
      const flatSample = flattenHierarchy(sampleData)
      flatSample.forEach(item => {
        if (item.level <= 2) {
          initialExpanded.add(item.id)
        }
      })
      setExpandedRows(initialExpanded)
    } finally {
      setLoading(false)
    }
  }

  const createSampleData = async () => {
    const sampleData = getSampleData()
    
    try {
      const dataToInsert = flattenHierarchy(sampleData).map(item => ({
        id: item.id,
        user_id: user?.id,
        report_date: reportDate,
        organization_name: item.organization_name,
        parent_organization_id: item.parent_organization_id,
        plan_amount: item.plan_amount,
        fact_amount: item.fact_amount,
        execution_percent: item.execution_percent,
        period_type: item.period_type,
        level: item.level,
        is_total_row: item.is_total_row,
        is_expandable: item.is_expandable
      }))

      const { error } = await supabase
        .from('plan_fact_revenue_reports')
        .insert(dataToInsert)

      if (error) throw error
      
      setData(sampleData)
      
      // Set initial expanded rows for sample data
      const initialExpanded = new Set<string>()
      const flatSample = flattenHierarchy(sampleData)
      flatSample.forEach(item => {
        if (item.level <= 2) {
          initialExpanded.add(item.id)
        }
      })
      setExpandedRows(initialExpanded)
    } catch (error) {
      console.error('Error creating sample data:', error)
      setData(sampleData)
      
      // Set initial expanded rows even on error
      const initialExpanded = new Set<string>()
      const flatSample = flattenHierarchy(sampleData)
      flatSample.forEach(item => {
        if (item.level <= 2) {
          initialExpanded.add(item.id)
        }
      })
      setExpandedRows(initialExpanded)
    }
  }

  const flattenHierarchy = (items: PlanFactRevenueData[]): PlanFactRevenueData[] => {
    const result: PlanFactRevenueData[] = []
    
    const flatten = (items: PlanFactRevenueData[]) => {
      items.forEach(item => {
        result.push(item)
        if (item.children && item.children.length > 0) {
          flatten(item.children)
        }
      })
    }
    
    flatten(items)
    return result
  }

  const getSampleData = (): PlanFactRevenueData[] => {
    // Generate UUIDs for the sample data
    const uuid1 = generateUUID()
    const uuid2 = generateUUID()
    const uuid3 = generateUUID()
    const uuid4 = generateUUID()
    const uuid5 = generateUUID()
    const uuid6 = generateUUID()
    const uuid7 = generateUUID()
    const uuid8 = generateUUID()
    const uuid9 = generateUUID()
    const _uuid10 = generateUUID()
    const _uuid11 = generateUUID()
    const _uuid12 = generateUUID()
    const _uuid13 = generateUUID()
    const _uuid14 = generateUUID()
    const _uuid15 = generateUUID()
    const _uuid16 = generateUUID()
    const _uuid17 = generateUUID()
    const _uuid18 = generateUUID()
    const _uuid19 = generateUUID()
    const _uuid20 = generateUUID()
    const _uuid21 = generateUUID()
    const _uuid22 = generateUUID()
    const _uuid23 = generateUUID()
    const _uuid24 = generateUUID()
    const _uuid25 = generateUUID()
    const uuid26 = generateUUID()
    const uuid27 = generateUUID()
    const uuid28 = generateUUID()
    const uuid29 = generateUUID()
    const _uuid30 = generateUUID()

    return [
      {
        id: uuid1,
        organization_name: 'Итого с начала месяца',
        parent_organization_id: null,
        plan_amount: 50785943,
        fact_amount: 36501653,
        execution_percent: 71.9,
        period_type: 'month',
        level: 0,
        is_total_row: true,
        is_expandable: true,
        children: [
          {
            id: uuid2,
            organization_name: 'Маркова-Дорей Ю.В. ИП',
            parent_organization_id: uuid1,
            plan_amount: 15158821,
            fact_amount: 12654350,
            execution_percent: 83.5,
            period_type: 'month',
            level: 1,
            is_total_row: false,
            is_expandable: true,
            children: [
              {
                id: uuid3,
                organization_name: 'С начала месяца',
                parent_organization_id: uuid2,
                plan_amount: 15158821,
                fact_amount: 12654350,
                execution_percent: 83.5,
                period_type: 'month',
                level: 2,
                is_total_row: false,
                is_expandable: true,
                children: [
                  {
                    id: uuid4,
                    organization_name: 'Новый интернет магазин',
                    parent_organization_id: uuid3,
                    plan_amount: 748123,
                    fact_amount: 1066979,
                    execution_percent: 142.6,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  },
                  {
                    id: uuid5,
                    organization_name: 'ОЦ 1, Н.Новгород, Рождественская,43',
                    parent_organization_id: uuid3,
                    plan_amount: 1504688,
                    fact_amount: 1175986,
                    execution_percent: 78.2,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  },
                  {
                    id: uuid6,
                    organization_name: 'ОЦ 11, Н.Новгород, Бекетова,9',
                    parent_organization_id: uuid3,
                    plan_amount: 1124050,
                    fact_amount: 963251,
                    execution_percent: 85.7,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  },
                  {
                    id: uuid7,
                    organization_name: 'ОЦ 12, Н.Новгород, Страж Революции,6',
                    parent_organization_id: uuid3,
                    plan_amount: 485307,
                    fact_amount: 469988,
                    execution_percent: 96.8,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  },
                  {
                    id: uuid8,
                    organization_name: 'ОЦ 13, Городец, Новая,8',
                    parent_organization_id: uuid3,
                    plan_amount: 277529,
                    fact_amount: 236651,
                    execution_percent: 85.3,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  },
                  {
                    id: uuid9,
                    organization_name: 'ОЦ 14, Дзержинск, Мира,40',
                    parent_organization_id: uuid3,
                    plan_amount: 895879,
                    fact_amount: 705694,
                    execution_percent: 78.8,
                    period_type: 'month',
                    level: 3,
                    is_total_row: false,
                    is_expandable: false
                  }
                ]
              },
              {
                id: uuid26,
                organization_name: 'С начала года',
                parent_organization_id: uuid2,
                plan_amount: 15158821,
                fact_amount: 12654350,
                execution_percent: 83.5,
                period_type: 'year',
                level: 2,
                is_total_row: false,
                is_expandable: false
              }
            ]
          },
          {
            id: uuid27,
            organization_name: 'ООО "ОРТОБУМ"',
            parent_organization_id: uuid1,
            plan_amount: 18685996,
            fact_amount: 11549325,
            execution_percent: 61.8,
            period_type: 'month',
            level: 1,
            is_total_row: false,
            is_expandable: true,
            children: [
              {
                id: uuid28,
                organization_name: 'С начала месяца',
                parent_organization_id: uuid27,
                plan_amount: 19682851,
                fact_amount: 13306246,
                execution_percent: 67.6,
                period_type: 'month',
                level: 2,
                is_total_row: false,
                is_expandable: false
              }
            ]
          }
        ]
      },
      {
        id: uuid29,
        organization_name: 'Итого с начала года',
        parent_organization_id: null,
        plan_amount: 50785943,
        fact_amount: 36501653,
        execution_percent: 71.9,
        period_type: 'year',
        level: 0,
        is_total_row: true,
        is_expandable: false
      }
    ]
  }

  const buildHierarchy = (flatData: any[]): PlanFactRevenueData[] => {
    const map = new Map()
    const roots: PlanFactRevenueData[] = []

    // Создаем карту всех элементов
    flatData.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    // Строим иерархию
    flatData.forEach(item => {
      const node = map.get(item.id)
      if (item.parent_organization_id) {
        const parent = map.get(item.parent_organization_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`
  }

  const getPercentColor = (percent: number): string => {
    if (percent >= 100) return 'text-green-600 dark:text-green-400'
    if (percent >= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const exportToCSV = () => {
    const headers = [
      'Организация',
      'План, ₽',
      'Факт, ₽',
      '% выполнения плана'
    ]

    const flattenData = (items: PlanFactRevenueData[], result: any[] = []): any[] => {
      items.forEach(item => {
        result.push([
          item.organization_name,
          item.plan_amount,
          item.fact_amount,
          item.execution_percent
        ])
        if (item.children && item.children.length > 0) {
          flattenData(item.children, result)
        }
      })
      return result
    }

    const csvData = [headers, ...flattenData(data)]
    const csv = csvData.map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan_fact_revenue_${reportDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderMobileRow = (item: PlanFactRevenueData): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedRows.has(item.id)
    const paddingLeft = item.level * 16

    return (
      <React.Fragment key={item.id}>
        <div className={`border-b border-gray-200 py-3 px-4 ${
          item.is_total_row ? 'bg-gray-50 font-semibold' : 'bg-white'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    title={isExpanded ? 'Свернуть' : 'Развернуть'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-6 mr-2 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-medium text-gray-900 ${
                    item.is_total_row ? 'font-bold' : ''
                  }`}>
                    {item.organization_name}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-4 flex-shrink-0">
              <div className="text-sm text-gray-500">
                {formatCurrency(item.fact_amount)} из {formatCurrency(item.plan_amount)} ₽
              </div>
              <div className={`text-lg font-bold ${getPercentColor(item.execution_percent)}`}>
                {formatPercent(item.execution_percent)}
              </div>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && item.children?.map((child) => renderMobileRow(child))}
      </React.Fragment>
    )
  }

  const renderDesktopRow = (item: PlanFactRevenueData): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedRows.has(item.id)
    const paddingLeft = item.level * 24

    return (
      <React.Fragment key={item.id}>
        <tr className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${
          item.is_total_row ? 'bg-gray-100 dark:bg-dark-600 font-semibold' : ''
        }`}>
          <td className="px-6 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded transition-colors"
                  title={isExpanded ? 'Свернуть' : 'Развернуть'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 mr-2" />
              )}
              <span className={`${item.is_total_row ? 'font-bold' : ''} ${
                item.level > 0 ? 'text-gray-700 dark:text-gray-300' : ''
              }`}>
                {item.organization_name}
              </span>
            </div>
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
            {formatCurrency(item.plan_amount)}
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
            {formatCurrency(item.fact_amount)}
          </td>
          <td className={`px-6 py-3 text-sm text-right font-medium ${getPercentColor(item.execution_percent)}`}>
            {formatPercent(item.execution_percent)}
          </td>
        </tr>
        {hasChildren && isExpanded && item.children?.map((child) => renderDesktopRow(child))}
      </React.Fragment>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                План-факт на {new Date(reportDate).toLocaleDateString('ru-RU')} г.
              </h3>
              <button 
                onClick={exportToCSV}
                className="btn-primary text-sm px-3 py-1"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {data.map((item) => renderMobileRow(item))}
        </div>

        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700">
          <p>* Процент выполнения плана: зеленый ≥100%, желтый ≥80%, красный &lt;80%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            План-факт на {new Date(reportDate).toLocaleDateString('ru-RU')} г.
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Нажмите на стрелки для сворачивания/разворачивания организаций
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Фильтр</span>
          </button>
          
          <button 
            onClick={exportToCSV}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Организация
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                План, ₽
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Факт, ₽
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % выполнения плана
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => renderDesktopRow(item))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>* Процент выполнения плана: зеленый ≥100%, желтый ≥80%, красный &lt;80%</p>
        <p>* Нажмите на стрелки для разворачивания/сворачивания подразделений</p>
      </div>
    </div>
  )
}

export default PlanFactRevenueReport
