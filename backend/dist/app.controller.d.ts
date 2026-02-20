export declare class AppController {
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
        tenantId: string | null;
    } | {
        status: string;
        message: string;
        tenantId?: undefined;
    }>;
    uploadFiles(files: Array<any>): string[];
    getClients(clerkId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        tenantId: string;
        email: string | null;
        nit: string | null;
        phone: string | null;
        address: string | null;
    }[]>;
    searchClients(query: string): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        tenantId: string;
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
        id: string;
        brand: string | null;
        name: string;
        createdAt: Date | null;
        tenantId: string;
        clientId: string | null;
        model: string | null;
        serial: string | null;
        location: string | null;
        qrCode: string | null;
        client: {
            id: string;
            name: string;
            createdAt: Date | null;
            tenantId: string;
            email: string | null;
            nit: string | null;
            phone: string | null;
            address: string | null;
        } | null;
    }[]>;
    getMachines(clientId: string): Promise<{
        id: string;
        brand: string | null;
        name: string;
        createdAt: Date | null;
        tenantId: string;
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
        date: Date;
        id: string;
        createdAt: Date | null;
        tenantId: string;
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
            id: string;
            name: string;
            createdAt: Date | null;
            tenantId: string;
            email: string | null;
            nit: string | null;
            phone: string | null;
            address: string | null;
        };
        machine: {
            id: string;
            brand: string | null;
            name: string;
            createdAt: Date | null;
            tenantId: string;
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
            date: Date;
            id: string;
            createdAt: Date | null;
            tenantId: string;
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
                id: string;
                name: string;
                createdAt: Date | null;
                tenantId: string;
                email: string | null;
                nit: string | null;
                phone: string | null;
                address: string | null;
            };
        }[];
    }>;
}
