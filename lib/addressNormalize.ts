const STREET_TYPES: Record<string, string> = {
  'avenue': 'ave', 'ave': 'ave', 'boulevard': 'blvd', 'blvd': 'blvd',
  'circle': 'cir', 'cir': 'cir', 'court': 'ct', 'ct': 'ct',
  'drive': 'dr', 'dr': 'dr', 'highway': 'hwy', 'hwy': 'hwy',
  'lane': 'ln', 'ln': 'ln', 'parkway': 'pkwy', 'pkwy': 'pkwy',
  'place': 'pl', 'pl': 'pl', 'road': 'rd', 'rd': 'rd',
  'street': 'st', 'st': 'st', 'terrace': 'ter', 'ter': 'ter',
  'way': 'way', 'run': 'run', 'path': 'path', 'pass': 'pass',
  'point': 'pt', 'pt': 'pt', 'ridge': 'rdg', 'rdg': 'rdg',
  'crossing': 'xing', 'xing': 'xing', 'trail': 'trl', 'trl': 'trl',
  'square': 'sq', 'sq': 'sq', 'grove': 'grv', 'grv': 'grv',
}
const DIRECTIONALS: Record<string, string> = {
  'north': 'n', 'south': 's', 'east': 'e', 'west': 'w',
  'northeast': 'ne', 'northwest': 'nw', 'southeast': 'se', 'southwest': 'sw',
}
const UNIT_TYPES: Record<string, string> = {
  'apartment': 'apt', 'apt': 'apt', 'suite': 'ste', 'ste': 'ste',
  'unit': 'unit', 'floor': 'fl', 'fl': 'fl', 'building': 'bldg', 'bldg': 'bldg',
  'number': '#', 'no': '#', '#': '#',
}
export function normalizeAddress(address: string): string {
  if (!address) return ''
  const tokens = address.toLowerCase().replace(/[.,;:'"!?]/g,'').replace(/\s+/g,' ').trim().split(' ')
  return tokens.map(t => STREET_TYPES[t] || DIRECTIONALS[t] || UNIT_TYPES[t] || t).join(' ').trim()
}
export function normalizeZip(zip: string): string {
  if (!zip) return ''
  return zip.replace(/\D/g,'').substring(0,5)
}
export function addressesMatch(
  addr1: string, city1: string, state1: string, zip1: string,
  addr2: string, city2: string, state2: string, zip2: string
): { match: boolean; confidence: 'high'|'medium'|'low' } {
  const nz1=normalizeZip(zip1), nz2=normalizeZip(zip2)
  const na1=normalizeAddress(addr1), na2=normalizeAddress(addr2)
  const nc1=city1?.toLowerCase().trim()||'', nc2=city2?.toLowerCase().trim()||''
  const ns1=state1?.toLowerCase().trim()||'', ns2=state2?.toLowerCase().trim()||''
  if (nz1&&nz2&&nz1===nz2&&na1===na2) return {match:true,confidence:'high'}
  if (na1===na2&&nc1===nc2&&ns1===ns2) return {match:true,confidence:'medium'}
  if (na1===na2&&ns1===ns2) return {match:true,confidence:'low'}
  return {match:false,confidence:'low'}
}
export function levenshtein(a: string, b: string): number {
  const m=a.length, n=b.length
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0))
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
  return dp[m][n]
}
export function fuzzyAddressMatch(addr1: string, addr2: string): boolean {
  const n1=normalizeAddress(addr1), n2=normalizeAddress(addr2)
  return n1===n2||levenshtein(n1,n2)<=2
}
