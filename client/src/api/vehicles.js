import request from '@/utils/request'

export function getVehicles(params) {
  return request({
    url: '/vehicles',
    method: 'get',
    params
  })
}

export function createVehicle(data) {
  return request({
    url: '/vehicles',
    method: 'post',
    data
  })
}

export function updateVehicle(id, data) {
  return request({
    url: `/vehicles/${id}`,
    method: 'put',
    data
  })
}

export function deleteVehicle(id) {
  return request({
    url: `/vehicles/${id}`,
    method: 'delete'
  })
}
