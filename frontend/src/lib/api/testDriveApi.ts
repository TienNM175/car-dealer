import axiosClient from "@/lib/utils/axiosClient";

export interface TestDrive {
    id: string;
    customerId: string;
    vehicleId: string;
    scheduleDate: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getTestDrives(params?: { search?: string; status?: string }): Promise<TestDrive[]> {
    const res = await axiosClient.get("/test-drives", { params });
    return res.data;
}

export async function createTestDrive(payload: Partial<TestDrive>): Promise<TestDrive> {
    const res = await axiosClient.post("/test-drives", payload);
    return res.data;
}

export async function updateTestDrive(id: string, payload: Partial<TestDrive>): Promise<TestDrive> {
    const res = await axiosClient.put(`/test-drives/${id}`, payload);
    return res.data;
}

export async function deleteTestDrive(id: string): Promise<void> {
    await axiosClient.delete(`/test-drives/${id}`);
}
