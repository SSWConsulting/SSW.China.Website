/**
 * 结构化数据里多处共用的取值（DECISIONS §125）。
 *
 * 服务区域：团队在杭州，FDE 驻场覆盖上海、江苏、浙江，其他地区远程协作 ——
 * 与首页「常见问题 → 可以到现场驻场吗？」的回答一致。只声明「服务」这些地区，
 * 不暗示在杭州以外有办公室（办公地址只有 Organization.address 那一处）。
 */
export const areaServed = [
  { '@type': 'AdministrativeArea', name: '上海市' },
  { '@type': 'AdministrativeArea', name: '江苏省' },
  { '@type': 'AdministrativeArea', name: '浙江省' },
  { '@type': 'Country', name: '中国' },
];

/** 服务类型：三项 AI 服务与 FDE 都归在「企业 AI 转型」之下。 */
export const serviceType = '企业 AI 转型';
