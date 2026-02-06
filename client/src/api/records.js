import request from '@/utils/request'

// 通用记录 (保险/保养/年审)
export function getRecords(category, params) {
  return request({
    url: `/records/${category}`,
    method: 'get',
    params
  })
}

export function createRecord(category, data) {
  return request({
    url: `/records/${category}`,
    method: 'post',
    data
  })
}

export function updateRecord(category, id, data) {
  return request({
    url: `/records/${category}/${id}`,
    method: 'put',
    data
  })
}

export function deleteRecord(category, id) {
  return request({
    url: `/records/${category}/${id}`,
    method: 'delete'
  })
}

// 司机专属记录 (体检/驾驶证)
export function getDriverRecords(type, params) {
  const endpoint = type === 'physical' ? 'physical' : 'licenses'
  return request({
    url: `/driver-records/${endpoint}`,
    method: 'get',
    params
  })
}

export function createDriverRecord(type, data) {
  const endpoint = type === 'physical' ? 'physical' : 'licenses'
  return request({
    url: `/driver-records/${endpoint}`,
    method: 'post',
    data
  })
}

export function updateDriverRecord(type, id, data) {
  const endpoint = type === 'physical' ? 'physical' : 'licenses'
  return request({
    url: `/driver-records/${endpoint}/${id}`,
    method: 'put',
    data
  })
}

export function deleteDriverRecord(type, id) {
  const endpoint = type === 'physical' ? 'physical' : 'licenses'
  return request({
    url: `/driver-records/${endpoint}/${id}`,
    method: 'delete'
  })
}
