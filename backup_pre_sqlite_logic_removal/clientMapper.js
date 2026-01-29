const mapClientRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        // Standardize: use _id as the primary unique ID for navigation
        id: String(row._id || row.id || ''),
        // Keep original numeric ID for display if helpful
        numericId: row.id || row.sqliteId || null,
        name: row.name || '',
        alias: row.alias || '',
        rut: row.rut || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        contract: !!(row.contract ?? row.contractValue),
        notifications_enabled: (row.notifications_enabled !== undefined) ? (row.notifications_enabled ? 1 : 0) : (row.notificationsEnabled ? 1 : 0),
        notificationsEnabled: !!(row.notifications_enabled || row.notificationsEnabled),
        avatarUrl: row.avatarUrl || null,
        recurringPaymentEnabled: !!row.recurringPaymentEnabled,
        recurringAmount: row.recurringAmount ? Number(row.recurringAmount) : null,
        recurringCurrency: row.recurringCurrency || 'UYU',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

module.exports = { mapClientRow };
