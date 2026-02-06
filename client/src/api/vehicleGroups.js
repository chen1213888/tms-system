import request from '@/utils/request'

export function getVehicleGroups(params) {
  return request({
    url: '/vehicle-groups',
    method: 'get',
    params
  })
}

export function getAllVehicleGroups() {
  return request({
    url: '/vehicle-groups/all',
    method: 'get'
  })
}

export function createVehicleGroup(data) {
  return request({
    url: '/vehicle-groups',
    method: 'post',
    data
  })
}

export function updateVehicleGroup(id, data) {
  return request({
    url: `/vehicle-groups/${id}`,
    method: 'put',
    data
  })
}

export function deleteVehicleGroup(id) {
  return request({
    url: `/vehicle-groups/${id}`,
    method: 'delete'
  })
}
