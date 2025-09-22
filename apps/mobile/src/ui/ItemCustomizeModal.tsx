import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, Image, Pressable, ScrollView } from 'react-native'
import { useTheme } from '../theme/theme'
import { Icon } from './Icon'

type AddOn = { id: string; name: string; price: number; isRequired: boolean; maxQuantity: number }
interface Props {
    visible: boolean
    onClose: () => void
    item?: {
        id: string
        name: string
        image?: string
        price: number
        addOns?: AddOn[]
        currentQuantity?: number // Current quantity in cart
        currentAddOns?: Record<string, number> // Current add-ons in cart
        isUpdate?: boolean // Whether this is updating existing item
    }
    onConfirm: (payload: { itemId: string; quantity: number; addOns: Record<string, number> }) => void
}

export default function ItemCustomizeModal({ visible, onClose, item, onConfirm }: Props) {
    const theme = useTheme()
    const [quantity, setQuantity] = useState(1)
    const [selected, setSelected] = useState<Record<string, number>>({})

    useEffect(() => {
        if (!visible || !item) return
        
        // Initialize with current cart state or defaults
        setQuantity(item.currentQuantity || 1)
        setSelected(prev => {
            const next: Record<string, number> = {}
            ;(item.addOns || []).forEach(ao => {
                if (item.currentAddOns && item.currentAddOns[ao.id] !== undefined) {
                    // Use current cart values
                    next[ao.id] = item.currentAddOns[ao.id]
                } else {
                    // Use default values (required = 1, optional = 0)
                    next[ao.id] = ao.isRequired ? 1 : 0
                }
            })
            return next
        })
    }, [visible, item])

    const addOnSubtotal = useMemo(() => {
        if (!item) return 0
        return (item.addOns || []).reduce((sum, ao) => sum + (selected[ao.id] || 0) * ao.price, 0)
    }, [item, selected])

    const unitTotal = (item?.price || 0) + addOnSubtotal
    const lineTotal = unitTotal * quantity

    const updateAddOn = (ao: AddOn, delta: number) => {
        const cur = selected[ao.id] || 0
        let next = cur + delta
        if (next < 0) next = 0
        if (next > ao.maxQuantity) next = ao.maxQuantity
        if (ao.isRequired && next === 0) next = 1
        setSelected(s => ({ ...s, [ao.id]: next }))
    }

    const canConfirm = useMemo(() => {
        if (!item) return false
        // If no add-ons, can always confirm
        if (!item.addOns || item.addOns.length === 0) return true
        // If add-ons exist, check that all required ones are selected
        return item.addOns.every(ao => !ao.isRequired || (selected[ao.id] || 0) >= 1)
    }, [item, selected])

    if (!item) return null

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    padding: 16
                }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/120' }}
                            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>{item.name}</Text>
                            <Text style={{ marginTop: 4, color: theme.colors.muted }}>
                                Base: ₦{item.price.toLocaleString('en-NG')} • Add‑ons: ₦{addOnSubtotal.toLocaleString('en-NG')}
                            </Text>
                            {/* {item.isUpdate && (
                                <Text style={{ marginTop: 2, fontSize: 12, color: theme.colors.primary }}>
                                    Updating existing item in cart
                                </Text>
                            )} */}
                        </View>
                        <Pressable onPress={onClose}>
                            <Icon name="close" size={20} color={theme.colors.muted} />
                        </Pressable>
                    </View>

                    {/* Add-ons */}
                    {!!item.addOns?.length && (
                        <ScrollView style={{ maxHeight: 260 }}>
                            {(item.addOns || []).map(ao => {
                                const qty = selected[ao.id] || 0
                                return (
                                    <View key={ao.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                                        <View style={{ flexShrink: 1, marginRight: 8 }}>
                                            <Text style={{ fontWeight: '600', color: theme.colors.text }}>
                                                {ao.name} {ao.isRequired ? '• Required' : ''}
                                            </Text>
                                            <Text style={{ color: theme.colors.muted }}>
                                                ₦{ao.price.toLocaleString('en-NG')} • Max {ao.maxQuantity}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Pressable
                                                onPress={() => updateAddOn(ao, -1)}
                                                style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon name="minus" size={14} color={theme.colors.muted} />
                                            </Pressable>
                                            <Text style={{ width: 26, textAlign: 'center', fontWeight: '700', color: theme.colors.text }}>{qty}</Text>
                                            <Pressable
                                                onPress={() => updateAddOn(ao, +1)}
                                                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon name="plus" size={14} color="white" />
                                            </Pressable>
                                        </View>
                                    </View>
                                )
                            })}
                        </ScrollView>
                    )}

                    {/* Quantity + Total + Confirm */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Pressable
                                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                                style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="minus" size={16} color={theme.colors.muted} />
                            </Pressable>
                            <Text style={{ width: 30, textAlign: 'center', fontWeight: '700', color: theme.colors.text }}>{quantity}</Text>
                            <Pressable
                                onPress={() => setQuantity(q => q + 1)}
                                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="plus" size={16} color="white" />
                            </Pressable>
                        </View>

                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
                            Total: ₦{lineTotal.toLocaleString('en-NG')}
                        </Text>

                        <Pressable
                            disabled={!canConfirm}
                            onPress={() => onConfirm({ itemId: item.id, quantity, addOns: selected })}
                            style={{
                                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                                backgroundColor: canConfirm ? theme.colors.primary : theme.colors.border
                            }}>
                            <Text style={{ color: 'white', fontWeight: '700' }}>
                                {item.isUpdate ? 'Update Cart' : 'Add to Cart'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            <View style={{ height: 80 }} /> 
        </Modal>
    )
}