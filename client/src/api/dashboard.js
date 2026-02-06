import request from '@/utils/request'

export function getStatistics() {
  return request({
    url: '/dashboard/statistics',
    method: 'get'
  })
}
