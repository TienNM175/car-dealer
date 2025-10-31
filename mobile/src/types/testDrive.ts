// ============================================
// 4. src/types/testDrive.ts
// ============================================
export interface TestDriveRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: string;
  dealerId: string;
  scheduledDate: string;
  notes?: string;
}

export interface TestDriveResponse {
  id: string;
  scheduledDate: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  vehicle: {
    model: string;
    variant?: string;
    manufacturer: {
      name: string;
    };
  };
  staff: {
    firstName: string;
    lastName: string;
    dealer: {
      name: string;
      city: string;
      phone?: string;
    };
  };
}