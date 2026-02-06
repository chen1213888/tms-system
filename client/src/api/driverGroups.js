import request from '@/utils/request'

export function getDriverGroups(params) {
  return request({
    url: '/driver-groups',
    method: 'get',
    params
  })
}

export function getAllDriverGroups() {
  return request({
    url: '/driver-groups/all',
    method: 'get'
  })
}

export function createDriverGroup(data) {
  return request({
    url: '/driver-groups',
    method: 'post',
    data
  })
}

export function updateDriverGroup(id, data) {
  return request({
    url: `/driver-groups/${id}`,
    method: 'put',
    data
  })
}

export function deleteDriverGroup(id) {
  return request({
    url: `/driver-groups/${id}`,
    method: 'delete'
  })
}
