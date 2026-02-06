import request from '@/utils/request'

export function getDrivers(params) {
  return request({
    url: '/drivers',
    method: 'get',
    params
  })
}

export function createDriver(data) {
  return request({
    url: '/drivers',
    method: 'post',
    data
  })
}

export function updateDriver(id, data) {
  return request({
    url: `/drivers/${id}`,
    method: 'put',
    data
  })
}

export function deleteDriver(id) {
  return request({
    url: `/drivers/${id}`,
    method: 'delete'
  })
}
