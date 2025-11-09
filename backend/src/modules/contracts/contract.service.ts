import prisma from "../../config/database";
import {
  Prisma,
  ContractStatus,
  PaymentType,
  VehicleUnitStatus,
} from "@prisma/client";

const contractListInclude = Prisma.validator<Prisma.ContractInclude>()({
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
    },
  },
  vehicle: {
    include: {
      manufacturer: {
        select: {
          name: true,
        },
      },
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
  },
  staff: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
        },
      },
    },
  },
  customerDebts: true,
  vehicleUnit: {
    select: {
      id: true,
      vin: true,
      status: true,
      dealerId: true,
      storageType: true,
      reservedAt: true,
      deliveredAt: true,
    },
  },
  _count: {
    select: {
      feedbacks: true,
      complaints: true,
    },
  },
});

const contractDetailInclude = Prisma.validator<Prisma.ContractInclude>()({
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
    },
  },
  vehicle: {
    include: {
      manufacturer: true,
      images: true,
    },
  },
  staff: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dealerId: true,
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          city: true,
          phone: true,
          email: true,
        },
      },
    },
  },
  vehicleUnit: {
    select: {
      id: true,
      vin: true,
      status: true,
      dealerId: true,
      storageType: true,
      reservedAt: true,
      deliveredAt: true,
      engineNumber: true,
      batterySerial: true,
      color: true,
      location: true,
    },
  },
  exportDocuments: {
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      cancelledBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
  feedbacks: {
    orderBy: { createdAt: "desc" },
  },
  complaints: {
    orderBy: { createdAt: "desc" },
  },
  customerDebts: {
    orderBy: { createdAt: "desc" },
  },
});

type VehicleUnitWithContract = Prisma.VehicleUnitGetPayload<{
  include: {
    contract: {
      select: {
        id: true;
      };
    };
  };
}>;

interface ContractFilters {
  search?: string;
  status?: ContractStatus;
  customerId?: string;
  staffId?: string;
  dealerId?: string;
  paymentType?: PaymentType;
  fromDate?: Date;
  toDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CreateContractInput {
  customerId: string;
  staffId: string;
  vehicleId: string;
  vehicleUnitId?: string | null;
  quotationId?: string;
  promotionId?: string;
  basePrice: number;
  discount?: number;
  tax?: number; // Deprecated - không dùng nữa, luôn tính 10% VAT tự động
  paymentType: PaymentType;
  installmentMonths?: number;
  interestRate?: number;
  deliveryDate?: Date;
  notes?: string;
}

interface UpdateContractInput {
  quotationId?: string;
  promotionId?: string;
  basePrice?: number;
  discount?: number;
  tax?: number; // Deprecated - không dùng nữa, luôn tính 10% VAT tự động
  paymentType?: PaymentType;
  installmentMonths?: number;
  interestRate?: number;
  deliveryDate?: Date;
  notes?: string;
}

export class ContractService {
  /**
   * Map contractCode to contractNumber for frontend compatibility
   */
  private mapContractResponse(contract: any) {
    if (!contract) return contract;
    const dealerFromStaff = contract.staff?.dealer || contract.dealer || null;
    const dealerId =
      contract.dealerId || contract.staff?.dealerId || dealerFromStaff?.id;
    return {
      ...contract,
      contractNumber: contract.contractCode,
      dealer: dealerFromStaff,
      dealerId,
    };
  }

  private mapContractsResponse(contracts: any[]) {
    return contracts.map((contract) => this.mapContractResponse(contract));
  }

  /**
   * Calculate contract financial details
   * Theo quy định Việt Nam:
   * - VAT (Thuế giá trị gia tăng): 10% cố định trên giá sau giảm giá
   */
  private calculateFinancials(
    basePrice: number,
    discount: number,
    paymentType: PaymentType,
    installmentMonths?: number,
    interestRate?: number
  ) {
    // Tính giá sau giảm giá
    const priceAfterDiscount = basePrice - discount;

    // Tính thuế VAT: 10% cố định trên giá sau giảm giá (theo quy định Việt Nam)
    const taxAmount = priceAfterDiscount * 0.1; // 10% VAT

    // Giá cuối cùng = giá sau giảm giá + thuế VAT
    const finalPrice = priceAfterDiscount + taxAmount;

    let monthlyPayment = null;

    if (paymentType === "INSTALLMENT" && installmentMonths && interestRate) {
      // Calculate monthly payment with interest
      const principal = finalPrice;
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = installmentMonths;

      // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      monthlyPayment =
        (principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      monthlyPayment = Math.round(monthlyPayment * 100) / 100;
    }

    return {
      finalPrice,
      monthlyPayment,
      taxAmount,
    };
  }

  /**
   * Generate unique contract code
   */
  private async generateContractCode(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Get last contract number for this month
    const lastContract = await prisma.contract.findFirst({
      where: {
        contractCode: {
          startsWith: `CT-${year}${month}`,
        },
      },
      orderBy: {
        contractCode: "desc",
      },
    });

    let nextNumber = 1;
    if (lastContract) {
      const lastNumber = parseInt(
        lastContract.contractCode.split("-").pop() || "0"
      );
      nextNumber = lastNumber + 1;
    }

    return `CT-${year}${month}-${String(nextNumber).padStart(4, "0")}`;
  }

  /**
   * Get all contracts with filters
   */
  async getAllContracts(
    filters: ContractFilters,
    pagination: PaginationParams,
    _userId?: string,
    userRole?: string,
    dealerId?: string
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    // Build where clause
    const where: Prisma.ContractWhereInput = {
      ...(filters.search && {
        OR: [
          { contractCode: { contains: filters.search, mode: "insensitive" } },
          {
            customer: {
              firstName: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            customer: {
              lastName: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            customer: {
              email: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.staffId && { staffId: filters.staffId }),
      ...(filters.paymentType && { paymentType: filters.paymentType }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      // Dealer staff can only see their dealer's contracts
      ...(userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER"
        ? { staff: { dealerId } }
        : filters.dealerId
          ? { staff: { dealerId: filters.dealerId } }
          : {}),
    };

    const total = await prisma.contract.count({ where });

    const contracts = await prisma.contract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: contractListInclude,
    });

    return {
      data: this.mapContractsResponse(contracts),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get contract by ID
   */
  async getContractById(id: string, userDealerId?: string, userRole?: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: contractDetailInclude,
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    // Check dealerId for DEALER roles (ADMIN/EVM_STAFF can access all)
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (contract.staff.dealerId !== userDealerId) {
        throw new Error("You can only access contracts from your own dealer");
      }
    }

    return this.mapContractResponse(contract);
  }

  /**
   * Create new contract
   */
  async createContract(data: CreateContractInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get staff info to determine dealerId
    const staff = await prisma.user.findUnique({
      where: { id: data.staffId },
      include: { dealer: true },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    if (!staff.dealerId) {
      throw new Error("Staff must be assigned to a dealer");
    }

    // Verify vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: {
        dealerInventories: {
          where: {
            dealerId: staff.dealerId, // Direct filter by dealerId
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    if (vehicle.status !== "ACTIVE") {
      throw new Error("Vehicle is not available for sale");
    }

    // Check inventory availability
    // Nếu không có inventory record, sẽ tự tạo khi tạo contract
    // Chỉ check nếu có inventory record và available < 1
    let dealerInventory = vehicle.dealerInventories[0];

    if (!dealerInventory) {
      // Không có inventory record - sẽ tạo mới khi tạo contract
      // Cho phép tạo contract (có thể là order trước, nhập kho sau)
    } else if (dealerInventory.available < 1) {
      // Có inventory record nhưng không còn available
      throw new Error("Vehicle not available in inventory");
    }

    // Validate installment data
    if (data.paymentType === "INSTALLMENT") {
      if (!data.installmentMonths || data.installmentMonths < 1) {
        throw new Error(
          "Installment months is required for installment payment"
        );
      }
      if (!data.interestRate || data.interestRate < 0) {
        throw new Error("Interest rate is required for installment payment");
      }
    }

    // Validate quotation if provided
    if (data.quotationId) {
      const quotation = await prisma.quotation.findUnique({
        where: { id: data.quotationId },
      });
      if (!quotation) {
        throw new Error("Quotation not found");
      }
      if (quotation.status !== "SENT") {
        throw new Error("Quotation must be in SENT status to create contract");
      }
    }

    // Validate promotion if provided
    if (data.promotionId) {
      const promotion = await prisma.dealerDiscount.findUnique({
        where: { id: data.promotionId },
      });
      if (!promotion) {
        throw new Error("Promotion not found");
      }
      if (!promotion.isActive) {
        throw new Error("Promotion is not active");
      }
      // Check minPurchase requirement
      if (
        promotion.minPurchase &&
        data.basePrice < Number(promotion.minPurchase)
      ) {
        throw new Error(
          `Minimum purchase amount is ${promotion.minPurchase.toLocaleString()} VNĐ. Your order value is ${data.basePrice.toLocaleString()} VNĐ.`
        );
      }
    }

    let selectedVehicleUnit: Prisma.VehicleUnitGetPayload<{
      include: { contract: { select: { id: true } } };
    }> | null = null;

    if (data.vehicleUnitId) {
      selectedVehicleUnit = await prisma.vehicleUnit.findUnique({
        where: { id: data.vehicleUnitId },
        include: {
          contract: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!selectedVehicleUnit) {
        throw new Error("Vehicle unit not found");
      }

      if (selectedVehicleUnit.vehicleId !== data.vehicleId) {
        throw new Error("Vehicle unit does not match the selected vehicle");
      }

      if (
        selectedVehicleUnit.dealerId &&
        selectedVehicleUnit.dealerId !== staff.dealerId
      ) {
        throw new Error("Vehicle unit does not belong to your dealer");
      }

      if (selectedVehicleUnit.contract?.id) {
        throw new Error("Vehicle unit is already linked to another contract");
      }

      const allowedStatuses: VehicleUnitStatus[] = ["IN_STOCK", "RESERVED"];

      if (!allowedStatuses.includes(selectedVehicleUnit.status)) {
        throw new Error("Vehicle unit must be in stock or reserved");
      }
    }

    // Calculate financials (VAT 10% tự động)
    const { finalPrice, monthlyPayment, taxAmount } = this.calculateFinancials(
      data.basePrice,
      data.discount || 0,
      data.paymentType,
      data.installmentMonths,
      data.interestRate
    );

    // Generate contract code
    const contractCode = await this.generateContractCode();

    // Create contract with transaction
    const contract = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create contract
        const newContract = await tx.contract.create({
          data: {
            contractCode,
            customerId: data.customerId,
            staffId: data.staffId,
            vehicleId: data.vehicleId,
            ...(data.quotationId && { quotationId: data.quotationId }),
            ...(data.promotionId && { promotionId: data.promotionId }),
            basePrice: data.basePrice,
            discount: data.discount || 0,
            tax: taxAmount,
            finalPrice,
            paymentType: data.paymentType,
            installmentMonths: data.installmentMonths,
            monthlyPayment,
            interestRate: data.interestRate,
            status: "DRAFT",
            deliveryDate: data.deliveryDate,
            notes: data.notes,
          },
          include: contractDetailInclude,
        });

        // Reserve inventory (don't reduce quantity, just reserve)
        // Nếu chưa có inventory record, tạo mới
        if (!dealerInventory) {
          // Tạo inventory record mới
          await tx.inventory.create({
            data: {
              dealerId: staff.dealerId,
              vehicleId: data.vehicleId,
              quantity: 1,
              reserved: 1,
              sold: 0,
              available: 0, // Sau khi reserve, available = 0
            },
          });
        } else {
          // Cập nhật inventory record hiện có
          await tx.inventory.update({
            where: {
              dealerId_vehicleId: {
                dealerId: dealerInventory.dealerId,
                vehicleId: data.vehicleId,
              },
            },
            data: {
              reserved: { increment: 1 }, // Tăng số đã đặt
              available: { decrement: 1 }, // Giảm số có sẵn
            },
          });
        }

        // Update customer status to PURCHASED if not already
        if (customer.status !== "PURCHASED") {
          await tx.customer.update({
            where: { id: data.customerId },
            data: { status: "PURCHASED" },
          });

          // Add lifecycle event
          await tx.customerLifecycle.create({
            data: {
              customerId: data.customerId,
              status: "PURCHASED",
              notes: `Contract ${contractCode} created`,
              changedBy: userId,
            },
          });
        }

        if (selectedVehicleUnit) {
          await tx.contract.update({
            where: { id: newContract.id },
            data: {
              vehicleUnit: {
                connect: { id: selectedVehicleUnit.id },
              },
            },
          });

          await tx.vehicleUnit.update({
            where: { id: selectedVehicleUnit.id },
            data: {
              status:
                selectedVehicleUnit.status === "IN_STOCK"
                  ? "RESERVED"
                  : selectedVehicleUnit.status,
              storageType: "DEALER",
              dealer: { connect: { id: staff.dealerId } },
              reservedAt: selectedVehicleUnit.reservedAt ?? new Date(),
            },
          });
        }

        return tx.contract.findUnique({
          where: { id: newContract.id },
          include: contractDetailInclude,
        });
      }
    );

    // Map contractCode to contractNumber for frontend compatibility
    return {
      ...contract,
      contractNumber: contract.contractCode,
    };
  }

  /**
   * Update contract
   */
  async updateContract(
    id: string,
    data: UpdateContractInput,
    userDealerId?: string,
    userRole?: string
  ) {
    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        basePrice: true,
        discount: true,
        tax: true,
        paymentType: true,
        installmentMonths: true,
        interestRate: true,
        staff: {
          select: {
            dealerId: true,
          },
        },
      },
    });

    if (!existingContract) {
      throw new Error("Contract not found");
    }

    // Check dealerId for DEALER roles (ADMIN/EVM_STAFF can access all)
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (existingContract.staff.dealerId !== userDealerId) {
        throw new Error("You can only update contracts from your own dealer");
      }
    }

    // Can only update DRAFT or PENDING contracts
    if (
      existingContract.status !== "DRAFT" &&
      existingContract.status !== "PENDING"
    ) {
      throw new Error("Can only update draft or pending contracts");
    }

    // Calculate new financials if price/discount changed (VAT 10% tự động)
    const basePrice = data.basePrice ?? Number(existingContract.basePrice);

    // Validate promotion if provided or changed
    if (data.promotionId) {
      const promotion = await prisma.dealerDiscount.findUnique({
        where: { id: data.promotionId },
      });
      if (!promotion) {
        throw new Error("Promotion not found");
      }
      if (!promotion.isActive) {
        throw new Error("Promotion is not active");
      }
      // Check minPurchase requirement
      if (promotion.minPurchase && basePrice < Number(promotion.minPurchase)) {
        throw new Error(
          `Minimum purchase amount is ${promotion.minPurchase.toLocaleString()} VNĐ. Your order value is ${basePrice.toLocaleString()} VNĐ.`
        );
      }
    }
    const discount = data.discount ?? Number(existingContract.discount);
    const paymentType = data.paymentType ?? existingContract.paymentType;
    const installmentMonths =
      data.installmentMonths ?? existingContract.installmentMonths;
    const interestRate = data.interestRate ?? existingContract.interestRate;

    const { finalPrice, monthlyPayment, taxAmount } = this.calculateFinancials(
      basePrice,
      discount,
      paymentType,
      installmentMonths || undefined,
      interestRate ? Number(interestRate) : undefined
    );

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.discount !== undefined && { discount: data.discount }),
        tax: taxAmount, // Luôn cập nhật VAT 10%
        finalPrice,
        ...(data.paymentType && { paymentType: data.paymentType }),
        ...(data.installmentMonths !== undefined && {
          installmentMonths: data.installmentMonths,
        }),
        monthlyPayment,
        ...(data.interestRate !== undefined && {
          interestRate: data.interestRate,
        }),
        ...(data.deliveryDate && { deliveryDate: data.deliveryDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: contractDetailInclude,
    });

    return this.mapContractResponse(contract);
  }

  async assignVehicleUnit(
    id: string,
    vehicleUnitId: string | null,
    userId: string,
    userDealerId?: string,
    userRole?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        staff: { select: { dealerId: true } },
        vehicle: { select: { id: true } },
        vehicleUnit: {
          select: {
            id: true,
            status: true,
            reservedAt: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status === "CANCELLED" || contract.status === "COMPLETED") {
      throw new Error(
        "Cannot assign vehicle unit to a cancelled or completed contract"
      );
    }

    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (contract.staff.dealerId !== userDealerId) {
        throw new Error(
          "You can only assign vehicle units for your dealer's contracts"
        );
      }
    }

    const requestedVehicleUnitId = vehicleUnitId ?? null;
    const isSameUnit = contract.vehicleUnitId === requestedVehicleUnitId;

    if (isSameUnit) {
      const refreshedContract = await prisma.contract.findUnique({
        where: { id },
        include: contractDetailInclude,
      });
      return this.mapContractResponse(refreshedContract);
    }

    let targetVehicleUnit: VehicleUnitWithContract | null = null;

    if (requestedVehicleUnitId) {
      targetVehicleUnit = await prisma.vehicleUnit.findUnique({
        where: { id: requestedVehicleUnitId },
        include: {
          contract: { select: { id: true } },
        },
      });

      if (!targetVehicleUnit) {
        throw new Error("Vehicle unit not found");
      }

      if (targetVehicleUnit.vehicleId !== contract.vehicleId) {
        throw new Error("Vehicle unit does not match the contract vehicle");
      }

      if (
        targetVehicleUnit.contract &&
        targetVehicleUnit.contract.id !== contract.id
      ) {
        throw new Error("Vehicle unit is already linked to another contract");
      }

      if (
        targetVehicleUnit.status !== "IN_STOCK" &&
        targetVehicleUnit.status !== "RESERVED"
      ) {
        throw new Error("Vehicle unit must be available before assignment");
      }
    }

    const now = new Date();

    const updatedContract = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (contract.vehicleUnitId) {
          await tx.vehicleUnit.update({
            where: { id: contract.vehicleUnitId },
            data: {
              status: "IN_STOCK",
              reservedAt: null,
              updatedById: userId,
            },
          });
        }

        if (requestedVehicleUnitId) {
          await tx.vehicleUnit.update({
            where: { id: requestedVehicleUnitId },
            data: {
              status: "RESERVED",
              dealerId: contract.staff.dealerId,
              storageType: "DEALER",
              reservedAt: targetVehicleUnit?.reservedAt ?? now,
              updatedById: userId,
            },
          });
        }

        const result = await tx.contract.update({
          where: { id },
          data: {
            vehicleUnit: requestedVehicleUnitId
              ? { connect: { id: requestedVehicleUnitId } }
              : { disconnect: true },
          },
          include: contractDetailInclude,
        });

        return result;
      }
    );

    return this.mapContractResponse(updatedContract);
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    id: string,
    status: ContractStatus,
    _userId: string,
    userDealerId?: string,
    userRole?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vehicle: true,
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    // Check dealerId for DEALER roles (ADMIN/EVM_STAFF can access all)
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (contract.staff.dealerId !== userDealerId) {
        throw new Error("You can only update contracts from your own dealer");
      }
    }

    // Validate status transitions
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      DRAFT: ["PENDING", "CANCELLED"],
      PENDING: ["SIGNED", "CANCELLED"],
      SIGNED: ["DELIVERING", "CANCELLED"],
      DELIVERING: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[contract.status].includes(status)) {
      throw new Error(`Cannot transition from ${contract.status} to ${status}`);
    }

    const linkedVehicleUnitId = contract.vehicleUnitId;

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updateData: Prisma.ContractUpdateInput = {
          status,
          ...(status === "SIGNED" && { signedAt: new Date() }),
          ...(status === "COMPLETED" && { deliveredAt: new Date() }),
        };

        if (status === "CANCELLED" && linkedVehicleUnitId) {
          updateData.vehicleUnit = { disconnect: true };
        }

        const updatedContract = await tx.contract.update({
          where: { id },
          data: updateData,
          include: contractDetailInclude,
        });

        if (linkedVehicleUnitId) {
          if (status === "DELIVERING") {
            await tx.vehicleUnit.update({
              where: { id: linkedVehicleUnitId },
              data: {
                status: "IN_TRANSIT",
                updatedById: _userId,
              },
            });
          }

          if (status === "COMPLETED") {
            await tx.vehicleUnit.update({
              where: { id: linkedVehicleUnitId },
              data: {
                status: "DELIVERED",
                deliveredAt: new Date(),
                updatedById: _userId,
              },
            });
          }

          if (status === "CANCELLED" && contract.status !== "COMPLETED") {
            await tx.vehicleUnit.update({
              where: { id: linkedVehicleUnitId },
              data: {
                status: "IN_STOCK",
                reservedAt: null,
                updatedById: _userId,
              },
            });
          }
        }

        return updatedContract;
      }
    );

    return this.mapContractResponse(result);
  }

  /**
   * Delete contract (only DRAFT)
   */
  async deleteContract(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            dealer: true,
          },
        },
        vehicleUnit: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "DRAFT") {
      throw new Error("Can only delete draft contracts");
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Release reserved inventory
      await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId: contract.staff.dealerId!,
            vehicleId: contract.vehicleId,
          },
        },
        data: {
          reserved: { decrement: 1 },
          available: { increment: 1 },
        },
      });

      if (contract.vehicleUnitId) {
        await tx.vehicleUnit.update({
          where: { id: contract.vehicleUnitId },
          data: {
            status: "IN_STOCK",
            reservedAt: null,
            updatedById: null,
          },
        });
      }

      // Delete contract
      await tx.contract.delete({
        where: { id },
      });
    });

    return { message: "Contract deleted successfully" };
  }

  /**
   * Get contract statistics
   */
  async getContractStatistics(filters?: {
    dealerId?: string;
    staffId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: Prisma.ContractWhereInput = {
      ...(filters?.dealerId && { staff: { dealerId: filters.dealerId } }),
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters?.toDate && { createdAt: { lte: filters.toDate } }),
    };

    // Overall statistics
    const totalStats = await prisma.contract.aggregate({
      where,
      _count: true,
      _sum: {
        basePrice: true,
        discount: true,
        tax: true,
        finalPrice: true,
      },
      _avg: {
        finalPrice: true,
        discount: true,
        tax: true,
      },
    });

    // By status
    const byStatus = await prisma.contract.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    // By payment type
    const byPaymentType = await prisma.contract.groupBy({
      by: ["paymentType"],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    return {
      total: {
        count: totalStats._count,
        totalRevenue: totalStats._sum.finalPrice || 0,
        totalDiscount: totalStats._sum.discount || 0,
        averageOrderValue: totalStats._avg.finalPrice || 0,
      },
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
      byPaymentType: byPaymentType.map((item) => ({
        type: item.paymentType,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
    };
  }

  /**
   * Get contracts by status
   */
  async getContractsByStatus(dealerId?: string) {
    const where: Prisma.ContractWhereInput = {
      ...(dealerId && { staff: { dealerId } }),
    };

    const byStatus = await prisma.contract.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    return byStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }
}
