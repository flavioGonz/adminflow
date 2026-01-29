const mapClientRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        // Standardize: use _id as the primary unique ID
        id: String(row._id || row.id || ''),
        // Mantener numericId solo si ya existe en el documento (migración previa)
        numericId: row.id || row.numericId || null,
        name: row.name || '',
        alias: row.alias || '',
        rut: row.rut || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        contract: !!(row.contract ?? row.contractValue),
        notificationsEnabled: !!(row.notificationsEnabled || row.notifications_enabled),
        avatarUrl: row.avatarUrl || null,
        recurringPaymentEnabled: !!row.recurringPaymentEnabled,
        recurringAmount: row.recurringAmount ? Number(row.recurringAmount) : null,
        recurringCurrency: row.recurringCurrency || 'UYU',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

module.exports = { mapClientRow };
