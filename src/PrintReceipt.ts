import { loadAllItems, loadPromotions } from './Dependencies'

class ShopItem {
  constructor(public barcode: string,
    public quantity: number,
    public unitPrice: number,
    public name: string,
    public unit: string) {
  }
}

interface PromotionRule {
  type: string
  barcodes: string[]
}

function getItems(tags: string[]): ShopItem[] {
  const shopItems: ShopItem[] = []
  const allItems = loadAllItems()
  tags.forEach(tag => {
    let quantity = 1
    let barcode: string = tag
    if (tag.includes('-')) {
      barcode = tag.split('-')[0]
      quantity = Number(tag.split('-')[1])
    }
    const item = allItems.find(item => item.barcode === barcode)
    const index = shopItems.findIndex(item => item.barcode === barcode)
    index === -1
      ? shopItems.push(new ShopItem(barcode, quantity, item?.price || 0, item?.name || '', item?.unit || ''))
      : shopItems[index].quantity += quantity
  })
  return shopItems
}

function calculatePromotion(item: ShopItem, rule: PromotionRule): number {
  let discount = 0
  const index = rule.barcodes.findIndex(barcode => barcode === item.barcode)
  if (index !== -1) {
    if (rule.type === 'BUY_TWO_GET_ONE_FREE') {
      discount = Math.trunc(item.quantity / 3) * item.unitPrice
    }
  }
  return discount
}

function calculateSubtotal(item: ShopItem, rule: PromotionRule): number {
  const discount = calculatePromotion(item, rule)
  const subtotal = item.unitPrice * item.quantity - discount
  return subtotal
}

function calculateTotal(items: ShopItem[], rule: PromotionRule): number {
  return items.map(item => {
    const discount = calculatePromotion(item, rule)
    const subtotal = item.unitPrice * item.quantity - discount
    return subtotal
  }).reduce((a, b) => a + b)
}

function calculateTotalWithoutPromo(items: ShopItem[]): number {
  return items.map(item => item.quantity * item.unitPrice).reduce((a, b) => a + b)
}

function getBestPromotion(items: ShopItem[]): PromotionRule {
  const rules = loadPromotions()
  return rules.map((rule) => {
    return { promotion: rule, subtotal: calculateTotal(items, rule) }
  })
    .sort((a, b) => a.subtotal - b.subtotal)[0]
    .promotion
}

function getUnitPostfix(item: ShopItem): string {
  return item.quantity > 1 ? 's' : ''
}

function renderShopItem(item: ShopItem, bestRule: PromotionRule): string {
  const unit = item.unit + getUnitPostfix(item)
  return `Name：${item.name}，Quantity：${item.quantity} ${unit}，Unit：${item.unitPrice.toFixed(2)}(yuan)，Subtotal：${calculateSubtotal(item, bestRule).toFixed(2)}(yuan)\n`
}

function renderReceipt(shopItems: ShopItem[], bestRule: PromotionRule): string {
  const header = '***<store earning no money>Receipt ***\n'
  const horizontalLine = '----------------------\n'
  const end = '**********************'

  let receipt = ''
  receipt += header
  shopItems.forEach(item => {
    receipt += renderShopItem(item, bestRule)
  })

  receipt += horizontalLine
  receipt += `Total：${calculateTotal(shopItems, bestRule).toFixed(2)}(yuan)\n`
  receipt += `Discounted prices：${(calculateTotalWithoutPromo(shopItems) - calculateTotal(shopItems, bestRule)).toFixed(2)}(yuan)\n`
  receipt += end

  return receipt
}

export function printReceipt(tags: string[]): string {

  const shopItems = getItems(tags)
  const bestRule = getBestPromotion(shopItems)
  const receipt = renderReceipt(shopItems, bestRule)

  return receipt
}
