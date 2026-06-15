#!/usr/bin/env node
// Generates seed route JSON files for all 9 Davao City routes × 2 periods
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/routes')
mkdirSync(OUT, { recursive: true })

const ROUTES = [
  {
    route_number: 'R102',
    name: 'Toril – Agdao',
    area: 'South–North Corridor',
    color: '#27AE60',
    am: { start_time: '05:30', end_time: '09:00' },
    pm: { start_time: '16:00', end_time: '20:00' },
    points: [
      { name: 'Toril Terminal', lat: 7.0092, lng: 125.5714 },
      { name: 'Bago Gallera', lat: 7.0199, lng: 125.5788 },
      { name: 'Juna Subdivision', lat: 7.0339, lng: 125.5855 },
      { name: 'Talomo Market', lat: 7.0442, lng: 125.5901 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
      { name: 'SM City Davao', lat: 7.0825, lng: 125.6132 },
      { name: 'Agdao Market', lat: 7.1003, lng: 125.6174 },
    ],
  },
  {
    route_number: 'R103',
    name: 'Matina – Agdao',
    area: 'Inner City Loop',
    color: '#2980B9',
    am: { start_time: '05:30', end_time: '08:30' },
    pm: { start_time: '16:00', end_time: '20:00' },
    points: [
      { name: 'NCCC Matina', lat: 7.0735, lng: 125.5897 },
      { name: 'Matina Market', lat: 7.0780, lng: 125.5921 },
      { name: 'Quimpo Blvd', lat: 7.0803, lng: 125.5967 },
      { name: 'CM Recto Ave', lat: 7.0803, lng: 125.6052 },
      { name: 'Victoria Plaza', lat: 7.0803, lng: 125.6133 },
      { name: 'Roxas Avenue', lat: 7.0769, lng: 125.6139 },
      { name: 'Magsaysay Park', lat: 7.0742, lng: 125.6161 },
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
      { name: 'Divisoria', lat: 7.0869, lng: 125.6192 },
      { name: 'Agdao Market', lat: 7.1003, lng: 125.6174 },
    ],
  },
  {
    route_number: 'R402',
    name: 'Buhangin – Toril',
    area: 'Cross-City Express',
    color: '#E67E22',
    am: { start_time: '05:00', end_time: '09:00' },
    pm: { start_time: '15:30', end_time: '19:30' },
    points: [
      { name: 'Buhangin Terminal', lat: 7.1165, lng: 125.6328 },
      { name: 'NCCC Buhangin', lat: 7.1120, lng: 125.6285 },
      { name: 'Damosa Gateway', lat: 7.1090, lng: 125.6210 },
      { name: 'SM Lanang', lat: 7.1042, lng: 125.6174 },
      { name: 'Sandawa Road', lat: 7.0902, lng: 125.6132 },
      { name: 'Mabuhay Road', lat: 7.0803, lng: 125.6087 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Juna Subdivision', lat: 7.0339, lng: 125.5855 },
      { name: 'Talomo Market', lat: 7.0442, lng: 125.5901 },
      { name: 'Toril Terminal', lat: 7.0092, lng: 125.5714 },
    ],
  },
  {
    route_number: 'R403',
    name: 'Calinan – Downtown',
    area: 'Western Highlands Route',
    color: '#8E44AD',
    am: { start_time: '05:00', end_time: '09:30' },
    pm: { start_time: '15:00', end_time: '19:30' },
    points: [
      { name: 'Calinan Terminal', lat: 7.1839, lng: 125.4769 },
      { name: 'Mintal Junction', lat: 6.9992, lng: 125.5438 },
      { name: 'Bago Oshiro', lat: 7.0267, lng: 125.5535 },
      { name: 'Catalunan Grande', lat: 7.0416, lng: 125.5652 },
      { name: 'Catalunan Pequeño', lat: 7.0547, lng: 125.5749 },
      { name: 'Matina Aplaya', lat: 7.0639, lng: 125.5811 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
    ],
  },
  {
    route_number: 'R503',
    name: 'Bangkal – Agdao',
    area: 'North Loop',
    color: '#16A085',
    am: { start_time: '05:30', end_time: '09:00' },
    pm: { start_time: '16:30', end_time: '20:00' },
    points: [
      { name: 'Bangkal Terminal', lat: 7.1042, lng: 125.5841 },
      { name: 'Ulas Junction', lat: 7.0902, lng: 125.5897 },
      { name: 'Matina Market', lat: 7.0780, lng: 125.5921 },
      { name: 'NCCC Matina', lat: 7.0735, lng: 125.5897 },
      { name: 'CM Recto Ave', lat: 7.0803, lng: 125.6052 },
      { name: 'Davao Doctors', lat: 7.0781, lng: 125.6124 },
      { name: 'Victoria Plaza', lat: 7.0803, lng: 125.6133 },
      { name: 'SM City Davao', lat: 7.0825, lng: 125.6132 },
      { name: 'Buhangin Road', lat: 7.1042, lng: 125.6174 },
      { name: 'Agdao Market', lat: 7.1003, lng: 125.6174 },
    ],
  },
  {
    route_number: 'R603',
    name: 'Mintal – Bankerohan',
    area: 'Western Express',
    color: '#C0392B',
    am: { start_time: '06:00', end_time: '09:00' },
    pm: { start_time: '16:00', end_time: '19:30' },
    points: [
      { name: 'Mintal Terminal', lat: 6.9992, lng: 125.5438 },
      { name: 'Bago Oshiro', lat: 7.0267, lng: 125.5535 },
      { name: 'Catalunan Grande', lat: 7.0416, lng: 125.5652 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Ecoland Terminal', lat: 7.0618, lng: 125.5981 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'Rizal Park', lat: 7.0742, lng: 125.6087 },
      { name: 'Davao Riverfront', lat: 7.0656, lng: 125.6087 },
    ],
  },
  {
    route_number: 'R763',
    name: 'Talomo – Downtown',
    area: 'South Central',
    color: '#D4AC0D',
    am: { start_time: '05:00', end_time: '09:00' },
    pm: { start_time: '15:30', end_time: '19:30' },
    points: [
      { name: 'Talomo Terminal', lat: 7.0339, lng: 125.5922 },
      { name: 'Juna Subdivision', lat: 7.0442, lng: 125.5901 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Bucana Road', lat: 7.0572, lng: 125.5981 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'Uyanguren Street', lat: 7.0680, lng: 125.6087 },
      { name: 'Roxas Avenue', lat: 7.0769, lng: 125.6139 },
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
      { name: 'Magallanes Street', lat: 7.0742, lng: 125.6093 },
    ],
  },
  {
    route_number: 'R783',
    name: 'Matina – Panacan',
    area: 'Metro Cross',
    color: '#1A5276',
    am: { start_time: '05:00', end_time: '09:00' },
    pm: { start_time: '15:30', end_time: '20:00' },
    points: [
      { name: 'Matina Terminal', lat: 7.0735, lng: 125.5897 },
      { name: 'NCCC Matina', lat: 7.0780, lng: 125.5921 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
      { name: 'SM City Davao', lat: 7.0825, lng: 125.6132 },
      { name: 'Agdao Market', lat: 7.1003, lng: 125.6174 },
      { name: 'Panacan Road', lat: 7.1392, lng: 125.6456 },
      { name: 'PGSO Panacan', lat: 7.1556, lng: 125.6573 },
    ],
  },
  {
    route_number: 'R793',
    name: 'Downtown – Calinan',
    area: 'Western Highlands',
    color: '#6C3483',
    am: { start_time: '05:30', end_time: '09:00' },
    pm: { start_time: '16:00', end_time: '20:00' },
    points: [
      { name: 'City Hall', lat: 7.0735, lng: 125.6124 },
      { name: 'Bankerohan', lat: 7.0618, lng: 125.6028 },
      { name: 'Ecoland', lat: 7.0618, lng: 125.5981 },
      { name: 'Maa', lat: 7.0547, lng: 125.5842 },
      { name: 'Catalunan Pequeño', lat: 7.0547, lng: 125.5749 },
      { name: 'Catalunan Grande', lat: 7.0416, lng: 125.5652 },
      { name: 'Mintal Junction', lat: 6.9992, lng: 125.5438 },
      { name: 'Bago Oshiro', lat: 7.0267, lng: 125.5535 },
      { name: 'Calinan Terminal', lat: 7.1839, lng: 125.4769 },
    ],
  },
]

for (const r of ROUTES) {
  for (const period of ['AM', 'PM']) {
    const times = period === 'AM' ? r.am : r.pm
    const obj = {
      route_number: r.route_number,
      name: r.name,
      area: r.area,
      color: r.color,
      time_period: period,
      start_time: times.start_time,
      end_time: times.end_time,
      points: r.points.map(p => ({ ...p, kind: 'stop' })),
    }
    const filename = `${r.route_number}-${period}.json`
    writeFileSync(join(OUT, filename), JSON.stringify(obj, null, 2))
    console.log('wrote', filename)
  }
}
console.log('Done — generated', ROUTES.length * 2, 'route files.')
