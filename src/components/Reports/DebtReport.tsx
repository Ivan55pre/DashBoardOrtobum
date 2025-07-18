import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react'
import { supabase } from '../../contexts/AuthContext'
import { useAuth } from '../../contexts/AuthContext'

interface DebtReportData {
  id: string
  organization_name: string
  parent_organization_id: string | null
  debt_amount: number
  overdue_amount: number
  credit_amount: number
  organization_type: 'contractor' | 'supplier' | 'buyer' | 'group' | 'total'
  level: number
  is_total_row: boolean
  is_group_row: boolean
  children?: DebtReportData[]
  expanded?: boolean
}

const DebtReport: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<DebtReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  
  // Filter states
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [availableOrganizations, setAvailableOrganizations] = useState<string[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<string[]>([])

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
  }, [user, reportDate, selectedOrganization, selectedCustomer])

  const loadSampleData = async () => {
    setLoading(true)
    
    try {
      const { data: existingData, error } = await supabase
        .from('debt_reports')
        .select('*')
        .eq('report_date', reportDate)
        .order('level')
        .order('organization_name')

      if (error) throw error

      if (existingData && existingData.length > 0) {
        // Populate filter options
        const organizations = [...new Set(existingData
          .filter(item => item.level === 1)
          .map(item => item.organization_name))]
        setAvailableOrganizations(organizations)

        const customers = [...new Set(existingData
          .filter(item => item.organization_type === 'buyer' && item.level >= 3)
          .map(item => item.organization_name))]
        setAvailableCustomers(customers)

        // Apply filters
        let filteredData = existingData
        
        if (selectedOrganization) {
          filteredData = filteredData.filter(item => 
            item.organization_name === selectedOrganization || 
            item.is_total_row ||
            (item.level > 1 && existingData.some(parent => 
              parent.id === item.parent_organization_id && 
              parent.organization_name === selectedOrganization
            ))
          )
        }

        if (selectedCustomer) {
          filteredData = filteredData.filter(item => 
            item.organization_name === selectedCustomer || 
            item.is_total_row ||
            item.level <= 2 ||
            item.organization_type !== 'buyer'
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
        .map(item => item.organization_name))]
      setAvailableOrganizations(organizations)

      const customers = [...new Set(flatSample
        .filter(item => item.organization_type === 'buyer' && item.level >= 3)
        .map(item => item.organization_name))]
      setAvailableCustomers(customers)

      // Apply filters to sample data
      let filteredSample = flatSample
      
      if (selectedOrganization) {
        filteredSample = filteredSample.filter(item => 
          item.organization_name === selectedOrganization || 
          item.is_total_row ||
          (item.level > 1 && flatSample.some(parent => 
            parent.id === item.parent_organization_id && 
            parent.organization_name === selectedOrganization
          ))
        )
      }

      if (selectedCustomer) {
        filteredSample = filteredSample.filter(item => 
          item.organization_name === selectedCustomer || 
          item.is_total_row ||
          item.level <= 2 ||
          item.organization_type !== 'buyer'
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
        organization_name: item.organization_name,
        parent_organization_id: item.parent_organization_id,
        debt_amount: item.debt_amount,
        overdue_amount: item.overdue_amount,
        credit_amount: item.credit_amount,
        organization_type: item.organization_type,
        level: item.level,
        is_total_row: item.is_total_row,
        is_group_row: item.is_group_row
      }))

      const { error } = await supabase
        .from('debt_reports')
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
        .map(item => item.organization_name))]
      setAvailableOrganizations(organizations)

      const customers = [...new Set(flatSample
        .filter(item => item.organization_type === 'buyer' && item.level >= 3)
        .map(item => item.organization_name))]
      setAvailableCustomers(customers)

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

  const flattenHierarchy = (items: DebtReportData[]): DebtReportData[] => {
    const result: DebtReportData[] = []
    
    const flatten = (items: DebtReportData[]) => {
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

  const getSampleData = (): DebtReportData[] => {
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
        organization_name: 'Итого',
        parent_organization_id: null,
        debt_amount: 119919250,
        overdue_amount: 4738064,
        credit_amount: 22765169,
        organization_type: 'total',
        level: 0,
        is_total_row: true,
        is_group_row: false,
        children: [
          {
            id: uuid2,
            organization_name: 'Маркова-Дорей Ю.В. ИП',
            parent_organization_id: uuid1,
            debt_amount: 4703875,
            overdue_amount: 0,
            credit_amount: 12601353,
            organization_type: 'contractor',
            level: 1,
            is_total_row: false,
            is_group_row: false,
            children: [
              {
                id: uuid3,
                organization_name: 'ПОКУПАТЕЛИ (сч. 62)',
                parent_organization_id: uuid2,
                debt_amount: 1788890,
                overdue_amount: 0,
                credit_amount: 1047299,
                organization_type: 'buyer',
                level: 2,
                is_total_row: false,
                is_group_row: false,
                children: [
                  {
                    id: uuid4,
                    organization_name: 'Физическое лицо',
                    parent_organization_id: uuid3,
                    debt_amount: 1403000,
                    overdue_amount: 0,
                    credit_amount: 0,
                    organization_type: 'buyer',
                    level: 3,
                    is_total_row: false,
                    is_group_row: false
                  },
                  {
                    id: uuid5,
                    organization_name: 'ЦПО ООО',
                    parent_organization_id: uuid3,
                    debt_amount: 267650,
                    overdue_amount: 0,
                    credit_amount: 0,
                    organization_type: 'buyer',
                    level: 3,
                    is_total_row: false,
                    is_group_row: false
                  }
                ]
              },
              {
                id: uuid6,
                organization_name: 'ПОСТАВЩИКИ (сч. 60)',
                parent_organization_id: uuid2,
                debt_amount: 2990937,
                overdue_amount: 0,
                credit_amount: 10685669,
                organization_type: 'supplier',
                level: 2,
                is_total_row: false,
                is_group_row: false,
                children: [
                  {
                    id: uuid7,
                    organization_name: 'Сатурн ООО Аренда',
                    parent_organization_id: uuid6,
                    debt_amount: 372240,
                    overdue_amount: 0,
                    credit_amount: 0,
                    organization_type: 'supplier',
                    level: 3,
                    is_total_row: false,
                    is_group_row: false
                  },
                  {
                    id: uuid8,
                    organization_name: 'ИНВЕСТ НЕДВИЖИМОСТЬ ООО',
                    parent_organization_id: uuid6,
                    debt_amount: 224624,
                    overdue_amount: 0,
                    credit_amount: 0,
                    organization_type: 'supplier',
                    level: 3,
                    is_total_row: false,
                    is_group_row: false
                  }
                ]
              }
            ]
          },
          {
            id: uuid9,
            organization_name: 'ООО "ОРТОБУМ"',
            parent_organization_id: uuid1,
            debt_amount: 115233221,
            overdue_amount: 4738064,
            credit_amount: 10181661,
            organization_type: 'contractor',
            level: 1,
            is_total_row: false,
            is_group_row: false,
            children: [
              {
                id: uuid10,
                organization_name: 'ПОКУПАТЕЛИ (сч. 62)',
                parent_organization_id: uuid9,
                debt_amount: 27639598,
                overdue_amount: 4738064,
                credit_amount: 8787566,
                organization_type: 'buyer',
                level: 2,
                is_total_row: false,
                is_group_row: false
              }
            ]
          }
        ]
      }
    ]
  }

  const buildHierarchy = (flatData: any[]): DebtReportData[] => {
    const map = new Map()
    const roots: DebtReportData[] = []

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

  const exportToCSV = () => {
    const headers = [
      'Организация',
      'Сумма Дт',
      'в т.ч. просроченная Дт',
      'Сумма Кт'
    ]

    const flattenData = (items: DebtReportData[], result: any[] = []): any[] => {
      items.forEach(item => {
        result.push([
          item.organization_name,
          item.debt_amount,
          item.overdue_amount,
          item.credit_amount
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
    a.download = `debt_report_${reportDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderMobileRow = (item: DebtReportData): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedRows.has(item.id)
    const paddingLeft = item.level * 16

    return (
      <React.Fragment key={item.id}>
        <div className={`border-b border-gray-200 py-3 px-4 ${
          item.is_total_row ? 'bg-gray-50 font-semibold' : 
          item.is_group_row ? 'bg-blue-50 font-medium' : 'bg-white'
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
                  } ${item.is_group_row ? 'text-blue-700' : ''}`}>
                    {item.organization_name}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-4 flex-shrink-0">
              {item.debt_amount > 0 && (
                <div className="text-sm font-medium text-gray-900">
                  Дт: {formatCurrency(item.debt_amount)} ₽
                </div>
              )}
              {item.overdue_amount > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  в т.ч. просроч.: {formatCurrency(item.overdue_amount)} ₽
                </div>
              )}
              {item.credit_amount > 0 && (
                <div className="text-sm font-medium text-gray-900 mt-1">
                  Кт: {formatCurrency(item.credit_amount)} ₽
                </div>
              )}
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && item.children?.map((child) => renderMobileRow(child))}
      </React.Fragment>
    )
  }

  const renderDesktopRow = (item: DebtReportData): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedRows.has(item.id)
    const paddingLeft = item.level * 24

    return (
      <React.Fragment key={item.id}>
        <tr className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${
          item.is_total_row ? 'bg-gray-100 dark:bg-dark-600 font-semibold' : 
          item.is_group_row ? 'bg-blue-50 dark:bg-blue-900/20 font-medium' : ''
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
                item.is_group_row ? 'font-medium text-blue-700 dark:text-blue-300' : ''
              } ${item.level > 0 ? 'text-gray-700 dark:text-gray-300' : ''}`}>
                {item.organization_name}
              </span>
            </div>
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
            {item.debt_amount > 0 ? formatCurrency(item.debt_amount) : ''}
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">
            {item.overdue_amount > 0 ? formatCurrency(item.overdue_amount) : ''}
          </td>
          <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
            {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : ''}
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
                Задолженности
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

            {/* Mobile Filters */}
            <div className="space-y-2">
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

              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Все клиенты</option>
                {availableCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {data.map((item) => renderMobileRow(item))}
        </div>

        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700">
          <p>* Дт - дебиторская задолженность (должны нам)</p>
          <p>* Кт - кредиторская задолженность (должны мы)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Задолженности на {new Date(reportDate).toLocaleDateString('ru-RU')} г.
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

          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Все клиенты</option>
            {availableCustomers.map(customer => (
              <option key={customer} value={customer}>{customer}</option>
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
                Организация
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сумма Дт
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                в т.ч. просроченная Дт
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сумма Кт
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => renderDesktopRow(item))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>* Дт - дебиторская задолженность (должны нам)</p>
        <p>* Кт - кредиторская задолженность (должны мы)</p>
        <p>* Нажмите на стрелки для разворачивания/сворачивания подразделений</p>
      </div>
    </div>
  )
}

export default DebtReport
