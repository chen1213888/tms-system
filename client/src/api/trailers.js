import request from '@/utils/request'

export function getTrailers(params) {
  return request({
    url: '/trailers',
    method: 'get',
    params
  })
}

export function createTrailer(data) {
  return request({
    url: '/trailers',
    method: 'post',
    data
  })
}

export function updateTrailer(id, data) {
  return request({
    url: `/trailers/${id}`,
    method: 'put',
    data
  })
}

export function deleteTrailer(id) {
  return request({
    url: `/trailers/${id}`,
    method: 'delete'
  })
}
