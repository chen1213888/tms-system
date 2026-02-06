import request from '@/utils/request'

export function getTrailerGroups(params) {
  return request({
    url: '/trailer-groups',
    method: 'get',
    params
  })
}

export function getAllTrailerGroups() {
  return request({
    url: '/trailer-groups/all',
    method: 'get'
  })
}

export function createTrailerGroup(data) {
  return request({
    url: '/trailer-groups',
    method: 'post',
    data
  })
}

export function updateTrailerGroup(id, data) {
  return request({
    url: `/trailer-groups/${id}`,
    method: 'put',
    data
  })
}

export function deleteTrailerGroup(id) {
  return request({
    url: `/trailer-groups/${id}`,
    method: 'delete'
  })
}
