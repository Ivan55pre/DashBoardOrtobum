import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react'
import { supabase } from '../../contexts/AuthContext'
import { useAuth } from '../../contexts/AuthContext'

interface InventoryBalanceData {
  id: string
  nomenclature: string
  parent_nomenclature_id: string | null
  quantity: number
  sum_amount: number
  dynamics_start_month_rub: number
  dynamics_start_month_percent: number
  dynamics_start_year_rub: number
  dynamics_start_year_percent: number
  level: number
  is_total_row: boolean
  children?: InventoryBalanceData[]
  expanded?: boolean
}

const InventoryBalanceReport: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<InventoryBalanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  
  // Filter states
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [availableOrganizations, setAvailableOrganizations] = useState<string[]>([])

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
  }, [user, reportDate, selectedOrganization])

  const loadSampleData = async () => {
    setLoading(true)
    
    try {
      const { data: existingData, error } = await supabase
        .from('inventory_balance_reports')
        .select('*')
        .eq('report_date', reportDate)
        .order('level')
        .order('nomenclature')

      if (error) throw error

      if (existingData && existingData.length > 0) {
        // Populate filter options
        const organizations = [...new Set(existingData
          .filter(item => item.level === 1)
          .map(item => item.nomenclature))]
        setAvailableOrganizations(organizations)

        // Apply filters
        let filteredData = existingData
        
        if (selectedOrganization) {
          filteredData = filteredData.filter(item => 
            item.nomenclature === selectedOrganization || 
            item.is_total_row ||
            (item.level > 1 && existingData.some(parent => 
              parent.id === item.parent_nomenclature_id && 
              parent.nomenclature === selectedOrganization
            ))
          )
        }

        const hierarchyData = buildHierarchy(filteredData)
        setData(hierarchyData)
        
        // Set initial expanded rows for loaded data
        const initialExpanded = new Set<string>()
        filteredData.forEach(item => {
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
      
      // Populate filter options from sample data
      const flatSample = flattenHierarchy(sampleData)
      const organizations = [...new Set(flatSample
        .filter(item => item.level === 1)
        .map(item => item.nomenclature))]
      setAvailableOrganizations(organizations)

      // Apply filters to sample data
      let filteredSample = flatSample
      
      if (selectedOrganization) {
        filteredSample = filteredSample.filter(item => 
          item.nomenclature === selectedOrganization || 
          item.is_total_row ||
          (item.level > 1 && flatSample.some(parent => 
            parent.id === item.parent_nomenclature_id && 
            parent.nomenclature === selectedOrganization
          ))
        )
      }

      const hierarchyData = buildHierarchy(filteredSample)
      setData(hierarchyData)
      
      // Set initial expanded rows for sample data
      const initialExpanded = new Set<string>()
      filteredSample.forEach(item => {
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
        report_date: reportDate,
        nomenclature: item.nomenclature,
        parent_nomenclature_id: item.parent_nomenclature_id,
        quantity: item.quantity,
        sum_amount: item.sum_amount,
        dynamics_start_month_rub: item.dynamics_start_month_rub,
        dynamics_start_month_percent: item.dynamics_start_month_percent,
        dynamics_start_year_rub: item.dynamics_start_year_rub,
        dynamics_start_year_percent: item.dynamics_start_year_percent,
        level: item.level,
        is_total_row: item.is_total_row
      }))

      const { error } = await supabase
        .from('inventory_balance_reports')
        .insert(dataToInsert)

      if (error) throw error
      
      // Reload data to apply filters
      await loadSampleData()
    } catch (error) {
      console.error('Error creating sample data:', error)
      const sampleData = getSampleData()
      
      // Populate filter options from sample data
      const flatSample = flattenHierarchy(sampleData)
      const organizations = [...new Set(flatSample
        .filter(item => item.level === 1)
        .map(item => item.nomenclature))]
      setAvailableOrganizations(organizations)

      setData(sampleData)
      
      // Set initial expanded rows even on error
      const initialExpanded = new Set<string>()
      const flatSampleData = flattenHierarchy(sampleData)
      flatSampleData.forEach(item => {
        if (item.level <= 2) {
          initialExpanded.add(item.id)
        }
      })
      setExpandedRows(initialExpanded)
    }
  }

  const flattenHierarchy = (items: InventoryBalanceData[]): InventoryBalanceData[] => {
    const result: InventoryBalanceData[] = []
    
    const flatten = (items: InventoryBalanceData[]) => {
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

  const getSampleData = (): InventoryBalanceData[] => {
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
    const uuid10 = generateUUID()

    return [
      {
        id: uuid1,
        nomenclature: 'Итого',
        parent_nomenclature_id: null,
        quantity: 163954,
        sum_amount: 197635082,
        dynamics_start_month_rub: -11034533,
        dynamics_start_month_percent: -5.29,
        dynamics_start_year_rub: 27880832,
        dynamics_start_year_percent: 16.42,
        level: 0,
        is_total_row: true,
        children: [
          {
            id: uuid2,
            nomenclature: 'Маркова-Дорей Ю.В. ИП',
            parent_nomenclature_id: uuid1,
            quantity: 56817,
            sum_amount: 49112903,
            dynamics_start_month_rub: 644672,
            dynamics_start_month_percent: 1.33,
            dynamics_start_year_rub: -185373,
            dynamics_start_year_percent: -0.38,
            level: 1,
            is_total_row: false,
            children: [
              {
                id: uuid3,
                nomenclature: 'Материалы',
                parent_nomenclature_id: uuid2,
                quantity: 10860,
                sum_amount: 412966,
                dynamics_start_month_rub: -22406,
                dynamics_start_month_percent: -5.15,
                dynamics_start_year_rub: 40547,
                dynamics_start_year_percent: 10.89,
                level: 2,
                is_total_row: false
              },
              {
                id: uuid4,
                nomenclature: 'Прочие материалы',
                parent_nomenclature_id: uuid2,
                quantity: 6500,
                sum_amount: 166018,
                dynamics_start_month_rub: 25868,
                dynamics_start_month_percent: 18.46,
                dynamics_start_year_rub: 31503,
                dynamics_start_year_percent: 23.42,
                level: 2,
                is_total_row: false
              },
              {
                id: uuid5,
                nomenclature: 'Товары в розничной торговле (по покупной стоимости)',
                parent_nomenclature_id: uuid2,
                quantity: 45769,
                sum_amount: 47996251,
                dynamics_start_month_rub: 168677,
                dynamics_start_month_percent: 0.35,
                dynamics_start_year_rub: -929606,
                dynamics_start_year_percent: -1.90,
                level: 2,
                is_total_row: false
              }
            ]
          },
          {
            id: uuid6,
            nomenclature: 'ООО "ОРТОБУМ"',
            parent_nomenclature_id: uuid1,
            quantity: 107137,
            sum_amount: 148522179,
            dynamics_start_month_rub: -11679205,
            dynamics_start_month_percent: -7.29,
            dynamics_start_year_rub: 28066205,
            dynamics_start_year_percent: 23.30,
            level: 1,
            is_total_row: false,
            children: [
              {
                id: uuid7,
                nomenclature: 'Материалы',
                parent_nomenclature_id: uuid6,
                quantity: 3142,
                sum_amount: 1203104,
                dynamics_start_month_rub: -39922,
                dynamics_start_month_percent: -3.21,
                dynamics_start_year_rub: 91665,
                dynamics_start_year_percent: 8.19,
                level: 2,
                is_total_row: false
              },
              {
                id: uuid8,
                nomenclature: 'Товары на складах',
                parent_nomenclature_id: uuid6,
                quantity: 58327,
                sum_amount: 58719816,
                dynamics_start_month_rub: -9814594,
                dynamics_start_month_percent: -14.32,
                dynamics_start_year_rub: 8426396,
                dynamics_start_year_percent: 16.75,
                level: 2,
                is_total_row: false,
                children: [
                  {
                    id: uuid9,
                    nomenclature: 'Комплектующие',
                    parent_nomenclature_id: uuid8,
                    quantity: 1,
                    sum_amount: 282,
                    dynamics_start_month_rub: 0,
                    dynamics_start_month_percent: 0,
                    dynamics_start_year_rub: 0,
                    dynamics_start_year_percent: 0,
                    level: 3,
                    is_total_row: false
                  },
                  {
                    id: uuid10,
                    nomenclature: 'Материалы',
                    parent_nomenclature_id: uuid8,
                    quantity: 12101,
                    sum_amount: 249,
                    dynamics_start_month_rub: 0,
                    dynamics_start_month_percent: 0,
                    dynamics_start_year_rub: 0,
                    dynamics_start_year_percent: 0,
                    level: 3,
                    is_total_row: false
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  const buildHierarchy = (flatData: any[]): InventoryBalanceData[] => {
    const map = new Map()
    const roots: InventoryBalanceData[] = []

    // Создаем карту всех элементов
    flatData.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    // Строим иерархию
    flatData.forEach(item => {
      const node = map.get(item.id)
      if (item.parent_nomenclature_id) {
        const parent = map.get(item.parent_nomenclature_id)
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

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatPercent = (num: number): string => {
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  const getPercentColor = (percent: number): string => {
    if (percent > 0) return 'text-green-600 dark:text-green-400'
    if (percent < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const exportToCSV = () => {
    const headers = [
      'Номенклатура',
      'Количество',
      'Сумма',
      'Динамика с нач. месяца, руб',
      'Динамика с нач. месяца, %',
      'Динамика с нач. года, руб',
      'Динамика с нач. года, %'
    ]

    const flattenData = (items: InventoryBalanceData[], result: any[] = []): any[] => {
      items.forEach(item => {
        result.push([
          item.nomenclature,
          item.quantity,
          item.sum_amount,
          item.dynamics_start_month_rub,
          item.dynamics_start_month_percent,
          item.dynamics_start_year_rub,
          item.dynamics_start_year_percent
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
    a.download = `inventory_balance_${reportDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderMobileRow = (item: InventoryBalanceData): React.ReactNode => {
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
                    {item.nomenclature}
                  </h3>
                  {item.quantity !== 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Количество: {formatNumber(item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right ml-4 flex-shrink-0">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(item.sum_amount)} ₽
              </div>
              <div className="text-xs text-gray-500 mt-1">
                С нач. месяца:
              </div>
              <div className={`text-xs font-medium ${getPercentColor(item.dynamics_start_month_percent)}`}>
                {formatPercent(item.dynamics_start_month_percent)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                С нач. года:
              </div>
              <div className={`text-xs font-medium ${getPercentColor(item.dynamics_start_year_percent)}`}>
                {formatPercent(item.dynamics_start_year_percent)}
              </div>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && item.children?.map((child) => renderMobileRow(child))}
      </React.Fragment>
    )
  }

  const renderDesktopRow = (item: InventoryBalanceData): React.ReactNode => {
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
                {item.nomenclature}
              </span>
            </div>
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">
            {item.quantity !== 0 ? formatNumber(item.quantity) : ''}
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
            {formatCurrency(item.sum_amount)}
          </td>
          <td className={`px-6 py-3 text-sm text-right ${getPercentColor(item.dynamics_start_month_rub)}`}>
            {formatCurrency(item.dynamics_start_month_rub)}
          </td>
          <td className={`px-6 py-3 text-sm text-right font-medium ${getPercentColor(item.dynamics_start_month_percent)}`}>
            {formatPercent(item.dynamics_start_month_percent)}
          </td>
          <td className={`px-6 py-3 text-sm text-right ${getPercentColor(item.dynamics_start_year_rub)}`}>
            {formatCurrency(item.dynamics_start_year_rub)}
          </td>
          <td className={`px-6 py-3 text-sm text-right font-medium ${getPercentColor(item.dynamics_start_year_percent)}`}>
            {formatPercent(item.dynamics_start_year_percent)}
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
                Остатки на {new Date(reportDate).toLocaleDateString('ru-RU')} г.
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

            {/* Mobile Filter */}
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Все организации</option>
              {availableOrganizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {data.map((item) => renderMobileRow(item))}
        </div>

        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700">
          <p>* Положительные значения динамики отображаются зеленым цветом, отрицательные - красным</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Остатки на {new Date(reportDate).toLocaleDateString('ru-RU')} г.
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Нажмите на стрелки для сворачивания/разворачивания категорий
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
          
          <select
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Все организации</option>
            {availableOrganizations.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
          
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
                Номенклатура
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Количество
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Динамика с нач. месяца, руб
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Динамика с нач. месяца, %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Динамика с нач. года, руб
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Динамика с нач. года, %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => renderDesktopRow(item))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>* Положительные значения динамики отображаются зеленым цветом, отрицательные - красным</p>
        <p>* Нажмите на стрелки для разворачивания/сворачивания категорий номенклатуры</p>
      </div>
    </div>
  )
}

export default InventoryBalanceReport
