export interface TimelineNode {
  id: string;
  label: string;
  level: number;
  count: number;
  children?: TimelineNode[];
  tagName: string;
}

export interface TimelineTree {
  years: TimelineNode[];
}

export function parseTimeTag(tagName: string): { year: number; month?: number; day?: number } | null {
  const parts = tagName.split('-');
  if (parts.length === 1) {
    const year = parseInt(parts[0]);
    return isNaN(year) ? null : { year };
  } else if (parts.length === 2) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    return (isNaN(year) || isNaN(month)) ? null : { year, month };
  } else if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    return (isNaN(year) || isNaN(month) || isNaN(day)) ? null : { year, month, day };
  }
  return null;
}

export function buildTimelineTree(tags: Array<{ name: string; type: string; count: number }>): TimelineTree {
  const dateTags = tags.filter(tag => tag.type === 'auto_date');
  const yearMap = new Map<number, Map<number, Map<number, { name: string; count: number }>>>();

  // 组织数据到层级结构
  dateTags.forEach(tag => {
    const parsed = parseTimeTag(tag.name);
    if (!parsed) return;

    const { year, month, day } = parsed;
    
    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }
    
    if (month !== undefined) {
      if (!yearMap.get(year)!.has(month)) {
        yearMap.get(year)!.set(month, new Map());
      }
      
      if (day !== undefined) {
        yearMap.get(year)!.get(month)!.set(day, { name: tag.name, count: tag.count });
      }
    }
  });

  // 构建树形结构
  const years: TimelineNode[] = [];
  
  for (const [year, monthMap] of yearMap.entries()) {
    const yearTag = dateTags.find(tag => tag.name === year.toString());
    const yearNode: TimelineNode = {
      id: `year-${year}`,
      label: `${year}年`,
      level: 0,
      count: yearTag?.count || 0,
      tagName: year.toString(),
      children: []
    };

    for (const [month, dayMap] of monthMap.entries()) {
      const monthTag = dateTags.find(tag => tag.name === `${year}-${month.toString().padStart(2, '0')}`);
      const monthNode: TimelineNode = {
        id: `month-${year}-${month}`,
        label: `${month}月`,
        level: 1,
        count: monthTag?.count || 0,
        tagName: `${year}-${month.toString().padStart(2, '0')}`,
        children: []
      };

      for (const [day, dayData] of dayMap.entries()) {
        const dayNode: TimelineNode = {
          id: `day-${year}-${month}-${day}`,
          label: `${day}日`,
          level: 2,
          count: dayData.count,
          tagName: dayData.name
        };
        monthNode.children!.push(dayNode);
      }

      if (monthNode.children!.length > 0) {
        yearNode.children!.push(monthNode);
      }
    }

    if (yearNode.children!.length > 0 || yearNode.count > 0) {
      years.push(yearNode);
    }
  }

  // 按年份倒序排序
  years.sort((a, b) => {
    const aYear = parseInt(a.tagName);
    const bYear = parseInt(b.tagName);
    return bYear - aYear;
  });

  return { years };
}