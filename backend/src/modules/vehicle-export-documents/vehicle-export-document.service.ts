import prisma from "../../config/database";
import {
  ExportDocumentStatus,
  Prisma,
  VehicleUnitStatus,
} from "@prisma/client";
import PDFDocument from "pdfkit";

interface GeneratedPdfResult {
  buffer: Buffer;
  fileName: string;
}

interface ExportDocumentFilters {
  search?: string;
  dealerId?: string;
  status?: ExportDocumentStatus;
  vehicleId?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CreateExportDocumentInput {
  contractId: string;
  vehicleUnitId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientId?: string;
  recipientAddress?: string;
  notes?: string;
}

export class VehicleExportDocumentService {
  private documentInclude = {
    vehicleUnit: {
      include: {
        vehicle: {
          select: {
            id: true,
            model: true,
            variant: true,
            year: true,
            color: true,
            retailPrice: true,
            batteryCapacity: true,
            range: true,
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    },
    dealer: {
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        address: true,
        phone: true,
        email: true,
      },
    },
    contract: {
      select: {
        id: true,
        contractCode: true,
        status: true,
        vehicleId: true,
        basePrice: true,
        discount: true,
        tax: true,
        finalPrice: true,
        paymentType: true,
        installmentMonths: true,
        monthlyPayment: true,
        interestRate: true,
        createdAt: true,
        deliveredAt: true,
        deliveryDate: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            identityCard: true,
          },
        },
      },
    },
    createdBy: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
    approvedBy: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
    cancelledBy: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
  } as const;

  private formatDate(value?: Date | string | null, withTime = true) {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(withTime && {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  private formatCurrency(value?: Prisma.Decimal | number | null) {
    if (value === undefined || value === null) return "-";
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numeric)) return "-";
    return numeric.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });
  }

  private async buildPdfBuffer(document: any): Promise<GeneratedPdfResult> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      pdf.on("data", (chunk) => chunks.push(chunk));
      pdf.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          fileName: `${document.code}.pdf`,
        })
      );
      pdf.on("error", reject);

      const dealerInfo =
        document.dealer ||
        document.contract?.staff?.dealer ||
        document.vehicleUnit?.dealer;
      const customer = document.contract?.customer;
      const vehicle = document.vehicleUnit?.vehicle;
      const vehicleUnit = document.vehicleUnit;

      pdf.font("Helvetica-Bold").fontSize(18).text("GIẤY XUẤT KHO", {
        align: "center",
      });
      pdf.moveDown(0.3);
      pdf.font("Helvetica").fontSize(11).text(`Số chứng từ: ${document.code}`, {
        align: "center",
      });
      pdf.text(
        `Ngày phát hành: ${this.formatDate(document.issuedAt ?? document.createdAt)}`,
        {
          align: "center",
        }
      );

      pdf.moveDown(1);

      pdf.font("Helvetica-Bold").fontSize(12).text("1. Thông tin đại lý", {
        underline: true,
      });
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(11);
      pdf.text(`Tên đại lý: ${dealerInfo?.name || "N/A"}`);
      pdf.text(`Mã đại lý: ${dealerInfo?.code || "N/A"}`);
      pdf.text(`Địa chỉ: ${dealerInfo?.address || dealerInfo?.city || "N/A"}`);
      pdf.text(
        `Liên hệ: ${dealerInfo?.phone || "-"} | ${dealerInfo?.email || "-"}`
      );

      pdf.moveDown(0.8);

      pdf.font("Helvetica-Bold").fontSize(12).text("2. Thông tin khách hàng", {
        underline: true,
      });
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(11);
      pdf.text(
        `Họ và tên: ${customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "N/A"}`
      );
      pdf.text(`Số điện thoại: ${customer?.phone || "-"}`);
      pdf.text(`Email: ${customer?.email || "-"}`);
      pdf.text(`Địa chỉ: ${customer?.address || "-"}`);
      pdf.text(
        `CMND/CCCD: ${document.recipientId || customer?.identityCard || "-"}`
      );

      pdf.moveDown(0.8);

      pdf.font("Helvetica-Bold").fontSize(12).text("3. Thông tin xe xuất kho", {
        underline: true,
      });
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(11);
      pdf.text(
        `Mẫu xe: ${vehicle ? `${vehicle.manufacturer?.name || ""} ${vehicle.model} ${vehicle.variant || ""}`.trim() : "N/A"}`
      );
      pdf.text(`Năm sản xuất: ${vehicle?.year || "-"}`);
      pdf.text(`Màu sắc: ${vehicle?.color || "-"}`);
      pdf.text(
        `Dung lượng pin: ${vehicle?.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : "-"}`
      );
      pdf.text(
        `Tầm hoạt động: ${vehicle?.range ? `${vehicle.range} km` : "-"}`
      );
      pdf.text(`VIN: ${vehicleUnit?.vin || "-"}`);
      pdf.text(`Số khung/động cơ: ${vehicleUnit?.engineNumber || "-"}`);
      pdf.text(`Số pin/battery: ${vehicleUnit?.batterySerial || "-"}`);

      pdf.moveDown(0.8);

      pdf.font("Helvetica-Bold").fontSize(12).text("4. Thông tin hợp đồng", {
        underline: true,
      });
      pdf.moveDown(0.2);
      const contract = document.contract;
      pdf.font("Helvetica").fontSize(11);
      pdf.text(`Số hợp đồng: ${contract?.contractCode || "-"}`);
      pdf.text(`Ngày tạo: ${this.formatDate(contract?.createdAt)}`);
      pdf.text(`Trạng thái: ${contract?.status || "-"}`);
      pdf.text(`Loại thanh toán: ${contract?.paymentType || "-"}`);
      pdf.text(`Giá trước VAT: ${this.formatCurrency(contract?.basePrice)}`);
      pdf.text(`Chiết khấu: ${this.formatCurrency(contract?.discount)}`);
      pdf.text(`Thuế VAT (10%): ${this.formatCurrency(contract?.tax)}`);
      pdf.text(`Giá sau thuế: ${this.formatCurrency(contract?.finalPrice)}`);
      if (contract?.paymentType === "INSTALLMENT") {
        pdf.text(
          `Trả góp: ${contract.installmentMonths || 0} tháng | Lãi suất: ${contract.interestRate || 0}% | Tiền hàng tháng: ${this.formatCurrency(contract.monthlyPayment)}`
        );
      }

      pdf.moveDown(0.8);

      pdf.font("Helvetica-Bold").fontSize(12).text("5. Thông tin người nhận", {
        underline: true,
      });
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(11);
      pdf.text(
        `Họ tên người nhận: ${document.recipientName || customer?.firstName || "-"}`
      );
      pdf.text(
        `Số điện thoại: ${document.recipientPhone || customer?.phone || "-"}`
      );
      pdf.text(
        `CMND/CCCD: ${document.recipientId || customer?.identityCard || "-"}`
      );
      pdf.text(
        `Địa chỉ: ${document.recipientAddress || customer?.address || "-"}`
      );

      pdf.moveDown(1);

      pdf.font("Helvetica-Bold").fontSize(12).text("6. Ghi chú", {
        underline: true,
      });
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(11);
      pdf.text(document.notes || "(Không có)");

      pdf.moveDown(1.2);

      const signatureY = pdf.y;
      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("ĐẠI DIỆN ĐẠI LÝ", 50, signatureY);
      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("KHÁCH HÀNG", 350, signatureY);
      pdf.moveDown(0.2);
      pdf.font("Helvetica").fontSize(10);
      pdf.text("(Ký, ghi rõ họ tên)", 50, pdf.y, { continued: false });
      pdf.text("(Ký, ghi rõ họ tên)", 350, signatureY + 15);

      pdf.end();
    });
  }

  private async generateExportCode(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    const lastDocument = await prisma.vehicleExportDocument.findFirst({
      where: {
        code: {
          startsWith: `XK-${year}${month}`,
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    let nextNumber = 1;
    if (lastDocument) {
      const lastNumber = parseInt(
        lastDocument.code.split("-").pop() || "0",
        10
      );
      nextNumber = lastNumber + 1;
    }

    return `XK-${year}${month}-${String(nextNumber).padStart(4, "0")}`;
  }

  async listExportDocuments(
    filters: ExportDocumentFilters,
    pagination: PaginationParams,
    userRole?: string,
    userDealerId?: string
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy ?? "createdAt";
    const sortOrder = pagination.sortOrder ?? "desc";

    const where: Prisma.VehicleExportDocumentWhereInput = {
      ...(filters.search && {
        OR: [
          { code: { contains: filters.search, mode: "insensitive" } },
          {
            vehicleUnit: {
              vin: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            contract: {
              contractCode: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.vehicleId && {
        vehicleUnit: { vehicleId: filters.vehicleId },
      }),
      ...((userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      userDealerId
        ? { dealerId: userDealerId }
        : {}),
    };

    const [total, documents] = await prisma.$transaction([
      prisma.vehicleExportDocument.count({ where }),
      prisma.vehicleExportDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.documentInclude,
      }),
    ]);

    return {
      data: documents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExportDocumentById(
    id: string,
    userRole?: string,
    userDealerId?: string
  ) {
    const document = await prisma.vehicleExportDocument.findUnique({
      where: { id },
      include: this.documentInclude,
    });

    if (!document) {
      throw new Error("Export document not found");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      document.dealerId !== userDealerId
    ) {
      throw new Error("You can only access export documents from your dealer");
    }

    return document;
  }

  async createExportDocument(
    data: CreateExportDocumentInput,
    userId: string,
    userRole?: string,
    userDealerId?: string
  ) {
    if (!data.contractId) {
      throw new Error("Contract ID is required");
    }

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        staff: {
          select: {
            dealerId: true,
          },
        },
        vehicle: true,
        vehicleUnit: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    const dealerId = contract.staff.dealerId;
    if (!dealerId) {
      throw new Error("Contract staff is not assigned to a dealer");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      dealerId !== userDealerId
    ) {
      throw new Error("You can only create export documents for your dealer");
    }

    const existingActiveDocument = await prisma.vehicleExportDocument.findFirst(
      {
        where: {
          contractId: contract.id,
          status: {
            notIn: ["CANCELLED"],
          },
        },
      }
    );

    if (existingActiveDocument) {
      throw new Error("An export document already exists for this contract");
    }

    const effectiveVehicleUnitId = contract.vehicleUnitId || data.vehicleUnitId;

    if (!effectiveVehicleUnitId) {
      throw new Error(
        "Contract does not have an assigned vehicle unit. Please assign a VIN before exporting."
      );
    }

    const vehicleUnit = await prisma.vehicleUnit.findUnique({
      where: { id: effectiveVehicleUnitId },
      include: {
        contract: true,
      },
    });

    if (!vehicleUnit) {
      throw new Error("Vehicle unit not found");
    }

    if (vehicleUnit.vehicleId !== contract.vehicleId) {
      throw new Error("Vehicle unit does not match the contract vehicle");
    }

    if (vehicleUnit.contract && vehicleUnit.contract.id !== contract.id) {
      throw new Error("Vehicle unit is already linked to another contract");
    }

    const allowedStatuses: VehicleUnitStatus[] = [
      "RESERVED",
      "IN_STOCK",
      "IN_TRANSIT",
      "DELIVERED",
    ];

    if (!allowedStatuses.includes(vehicleUnit.status)) {
      throw new Error(
        "Vehicle unit must be in stock, reserved, in transit, or delivered before exporting"
      );
    }

    const code = await this.generateExportCode();
    const now = new Date();

    const document = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Assign vehicle unit to contract if not already
        if (!contract.vehicleUnitId) {
          await tx.contract.update({
            where: { id: contract.id },
            data: {
              vehicleUnit: {
                connect: { id: vehicleUnit.id },
              },
            },
          });
        }

        const createdDocument = await tx.vehicleExportDocument.create({
          data: {
            code,
            vehicleUnitId: vehicleUnit.id,
            dealerId,
            contractId: contract.id,
            status: "DRAFT",
            issuedAt: now,
            recipientName: data.recipientName,
            recipientPhone: data.recipientPhone,
            recipientId: data.recipientId,
            recipientAddress: data.recipientAddress,
            notes: data.notes,
            createdById: userId,
          },
          include: this.documentInclude,
        });

        const updateData: Prisma.VehicleUnitUpdateInput = {
          storageType: "DEALER",
        };

        if (userId) {
          updateData.updatedBy = { connect: { id: userId } };
        }

        if (dealerId) {
          updateData.dealer = { connect: { id: dealerId } };
        }

        if (!vehicleUnit.reservedAt) {
          updateData.reservedAt = now;
        }

        if (contract.status === "COMPLETED") {
          updateData.status = "DELIVERED";
          if (!vehicleUnit.deliveredAt) {
            updateData.deliveredAt = now;
          }
        } else if (vehicleUnit.status === "IN_STOCK") {
          updateData.status = "RESERVED";
        }

        await tx.vehicleUnit.update({
          where: { id: vehicleUnit.id },
          data: updateData,
        });

        return createdDocument;
      }
    );

    return document;
  }

  async generateExportDocumentPdf(
    id: string,
    userRole?: string,
    userDealerId?: string
  ): Promise<GeneratedPdfResult> {
    const document = await this.getExportDocumentById(
      id,
      userRole,
      userDealerId
    );
    return this.buildPdfBuffer(document);
  }

  async approveExportDocument(
    id: string,
    userId: string,
    userRole?: string,
    userDealerId?: string
  ) {
    const document = await prisma.vehicleExportDocument.findUnique({
      where: { id },
      include: {
        vehicleUnit: true,
        dealer: { select: { id: true } },
        contract: {
          select: {
            id: true,
            status: true,
            staff: { select: { dealerId: true } },
          },
        },
      },
    });

    if (!document) {
      throw new Error("Export document not found");
    }

    if (document.status !== "DRAFT") {
      throw new Error("Only draft export documents can be approved");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      document.dealerId !== userDealerId
    ) {
      throw new Error("You can only approve export documents from your dealer");
    }

    const now = new Date();

    const updatedDocument = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const approved = await tx.vehicleExportDocument.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: now,
            approvedById: userId,
          },
          include: this.documentInclude,
        });

        await tx.vehicleUnit.update({
          where: { id: document.vehicleUnitId },
          data: {
            status: "DELIVERED",
            deliveredAt: now,
            updatedById: userId,
          },
        });

        return approved;
      }
    );

    return updatedDocument;
  }

  async cancelExportDocument(
    id: string,
    reason: string | undefined,
    userId: string,
    userRole?: string,
    userDealerId?: string
  ) {
    const document = await prisma.vehicleExportDocument.findUnique({
      where: { id },
      include: {
        dealer: { select: { id: true } },
      },
    });

    if (!document) {
      throw new Error("Export document not found");
    }

    if (document.status !== "DRAFT") {
      throw new Error("Only draft export documents can be cancelled");
    }

    if (
      (userRole === "DEALER_MANAGER" || userRole === "DEALER_STAFF") &&
      document.dealerId !== userDealerId
    ) {
      throw new Error("You can only cancel export documents from your dealer");
    }

    const now = new Date();

    const cancelledDocument = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const cancelled = await tx.vehicleExportDocument.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancelledById: userId,
            notes: reason || document.notes,
          },
          include: this.documentInclude,
        });

        await tx.vehicleUnit.update({
          where: { id: document.vehicleUnitId },
          data: {
            status: "IN_STOCK",
            reservedAt: null,
            updatedById: userId,
          },
        });

        return cancelled;
      }
    );

    return cancelledDocument;
  }
}
