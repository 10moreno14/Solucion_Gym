export declare class AppController {
    private ensureTenant;
    getWelcome(): {
        status: string;
        message: string;
    };
    syncUser(body: {
        clerkId: string;
        email: string;
        fullName: string;
    }): Promise<{
        status: string;
        message: string;
        tenantId?: undefined;
    } | {
        status: string;
        message: string;
        tenantId: string;
    }>;
    uploadFiles(files: Array<any>): string[];
    getClients(clerkId: string): Promise<{
        tenantId: string;
        id: string;
        name: string;
        createdAt: Date | null;
        email: string | null;
        nit: string | null;
        phone: string | null;
        address: string | null;
    }[]>;
    searchClients(query: string): Promise<{
        tenantId: string;
        id: string;
        name: string;
        createdAt: Date | null;
        email: string | null;
        nit: string | null;
        phone: string | null;
        address: string | null;
    }[]>;
    saveClient(body: any): Promise<{
        status: string;
        message: string;
    }>;
    deleteClient(body: {
        id: string;
    }): Promise<{
        status: string;
        message?: undefined;
    } | {
        status: string;
        message: string;
    }>;
    getAllMachines(clerkId: string): Promise<{
        tenantId: string;
        id: string;
        name: string;
        brand: string | null;
        createdAt: Date | null;
        clientId: string | null;
        model: string | null;
        serial: string | null;
        location: string | null;
        qrCode: string | null;
        client: {
            tenantId: string;
            id: string;
            name: string;
            createdAt: Date | null;
            email: string | null;
            nit: string | null;
            phone: string | null;
            address: string | null;
        } | null;
    }[]>;
    getMachines(clientId: string): Promise<{
        tenantId: string;
        id: string;
        name: string;
        brand: string | null;
        createdAt: Date | null;
        clientId: string | null;
        model: string | null;
        serial: string | null;
        location: string | null;
        qrCode: string | null;
    }[]>;
    saveMachine(body: any): Promise<{
        status: string;
        message: string;
    }>;
    deleteMachine(body: {
        id: string;
    }): Promise<{
        status: string;
        message?: undefined;
    } | {
        status: string;
        message: string;
    }>;
    getReports(clerkId: string, clientId?: string, start?: string, end?: string): Promise<{
        tenantId: string;
        date: Date;
        id: string;
        createdAt: Date | null;
        status: string | null;
        clientId: string;
        machineId: string;
        reportNumber: number;
        type: string | null;
        technicianName: string;
        technicianCc: string | null;
        activities: string[] | null;
        observations: string | null;
        photosBefore: string[] | null;
        photosAfter: string[] | null;
        technicianSignature: string | null;
        clientSignature: string | null;
        pdfUrl: string | null;
        client: {
            tenantId: string;
            id: string;
            name: string;
            createdAt: Date | null;
            email: string | null;
            nit: string | null;
            phone: string | null;
            address: string | null;
        };
        machine: {
            tenantId: string;
            id: string;
            name: string;
            brand: string | null;
            createdAt: Date | null;
            clientId: string | null;
            model: string | null;
            serial: string | null;
            location: string | null;
            qrCode: string | null;
        };
    }[]>;
    saveReport(body: any): Promise<{
        status: string;
        message: string;
        reportNumber?: undefined;
    } | {
        status: string;
        reportNumber: number;
        message?: undefined;
    }>;
    updateReport(body: any): Promise<{
        status: string;
        message?: undefined;
    } | {
        status: string;
        message: string;
    }>;
    deleteReport(body: {
        id: string;
    }): Promise<{
        status: string;
    }>;
    getStats(clerkId: string): Promise<{
        stats: {
            reports: number;
            clients: number;
            machines: number;
        };
        latestReports: {
            tenantId: string;
            date: Date;
            id: string;
            createdAt: Date | null;
            status: string | null;
            clientId: string;
            machineId: string;
            reportNumber: number;
            type: string | null;
            technicianName: string;
            technicianCc: string | null;
            activities: string[] | null;
            observations: string | null;
            photosBefore: string[] | null;
            photosAfter: string[] | null;
            technicianSignature: string | null;
            clientSignature: string | null;
            pdfUrl: string | null;
            client: {
                tenantId: string;
                id: string;
                name: string;
                createdAt: Date | null;
                email: string | null;
                nit: string | null;
                phone: string | null;
                address: string | null;
            };
        }[];
    }>;
    getPlans(clerkId: string): Promise<{
        tenantId: string;
        id: string;
        name: string;
        createdAt: Date;
        status: string;
        price: string;
        durationDays: number;
        description: string | null;
    }[]>;
    savePlan(body: any): Promise<{
        status: string;
        message: string;
    }>;
    togglePlan(body: {
        id: string;
        status: string;
        clerkId: string;
    }): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
    deletePlan(body: {
        id: string;
        clerkId: string;
    }): Promise<{
        status: string;
        message: string;
    }>;
    getAffiliates(clerkId: string): Promise<{
        id: string;
        fullName: string;
        documentType: string | null;
        documentNumber: string | null;
        phone: string | null;
        status: string;
        photoUrl: string | null;
        hasActivePlan: boolean;
        expirationDate: Date | null;
    }[]>;
    saveAffiliate(body: any): Promise<{
        status: string;
        message: string;
    }>;
    toggleAffiliate(body: {
        id: string;
        status: string;
        clerkId: string;
    }): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
    deleteAffiliate(body: {
        id: string;
        clerkId: string;
    }): Promise<{
        status: string;
        message: string;
    }>;
    getAffiliateStatus(clerkId: string, memberId: string): Promise<{
        hasActivePlan: boolean;
        endDate: null;
    } | {
        hasActivePlan: boolean;
        endDate: Date;
    }>;
    saveMembership(body: any): Promise<{
        status: string;
        message: string;
    }>;
    verifyAccess(body: {
        clerkId: string;
        documentNumber: string;
    }): Promise<{
        status: string;
        message: string;
        access?: undefined;
        affiliateName?: undefined;
    } | {
        status: string;
        access: string;
        affiliateName: string;
        message: string;
    }>;
    getRecentAccesses(clerkId: string): Promise<{
        tenantId: string;
        id: string;
        status: string;
        memberId: string;
        accessTime: Date;
        method: string;
        affiliate: {
            tenantId: string;
            id: string;
            createdAt: Date;
            fullName: string;
            status: string;
            phone: string | null;
            documentType: string | null;
            documentNumber: string | null;
            photoUrl: string | null;
        };
    }[]>;
    getAllAccesses(clerkId: string, dateString?: string): Promise<{
        tenantId: string;
        id: string;
        status: string;
        memberId: string;
        accessTime: Date;
        method: string;
        affiliate: {
            tenantId: string;
            id: string;
            createdAt: Date;
            fullName: string;
            status: string;
            phone: string | null;
            documentType: string | null;
            documentNumber: string | null;
            photoUrl: string | null;
        };
    }[]>;
    getGymDashboard(clerkId: string, orgId?: string, fullName?: string, orgName?: string): Promise<{
        status: string;
        message: string;
        stats?: undefined;
        expiringMemberships?: undefined;
    } | {
        status: string;
        stats: {
            activeAffiliates: number;
            monthlyIncome: number;
            todayAccesses: number;
        };
        expiringMemberships: {
            tenantId: string;
            id: string;
            createdAt: Date;
            status: string;
            memberId: string;
            planId: string;
            startDate: Date;
            endDate: Date;
            pricePaid: string;
            autoRenew: boolean;
            plan: {
                tenantId: string;
                id: string;
                name: string;
                createdAt: Date;
                status: string;
                price: string;
                durationDays: number;
                description: string | null;
            };
            affiliate: {
                tenantId: string;
                id: string;
                createdAt: Date;
                fullName: string;
                status: string;
                phone: string | null;
                documentType: string | null;
                documentNumber: string | null;
                photoUrl: string | null;
            };
        }[];
        message?: undefined;
    }>;
    getModulesConfig(clerkId: string, orgId?: string, fullName?: string, orgName?: string): Promise<{
        status: string;
        message: string;
        modulos?: undefined;
        plan?: undefined;
    } | {
        status: string;
        modulos: import("./db/schema").ModulosGym;
        plan: string;
        message?: undefined;
    }>;
    getTransactions(clerkId: string): Promise<{
        tenantId: string;
        date: Date;
        id: string;
        amount: string;
        type: string;
        description: string | null;
        category: string;
    }[]>;
    saveTransaction(body: any): Promise<{
        status: string;
        message: string;
    }>;
    deleteTransaction(body: {
        id: string;
        clerkId: string;
    }): Promise<{
        status: string;
        message: string;
    }>;
}
