"use client";

import {
  Alert,
  Card,
  Col,
  Descriptions,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { BadgeCheck, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import { getFarmerPaymentDetails, getFarmerProfile, verifyFarmerByNic } from "@/lib/govtech/farmer-registry";
import { getFarmerLands, verifyActiveCultivation } from "@/lib/govtech/cultivation";
import type {
  CultivationStatusResponse,
  FarmerPaymentDetailsResponse,
  FarmerProfile as FarmerProfileType,
  FarmerVerificationResponse,
  LandDetail,
  ServiceResult,
} from "@/lib/govtech/types";
import { formatExtent } from "@/lib/utils/format";

export default function FarmerProfile() {
  const { identity } = useAppStore();
  const farmerId = identity?.farmerId ?? "FARM000123";
  const nic = identity?.nic ?? "199012345678";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ServiceResult<FarmerProfileType> | null>(null);
  const [verification, setVerification] = useState<ServiceResult<FarmerVerificationResponse> | null>(null);
  const [lands, setLands] = useState<ServiceResult<{ lands: LandDetail[] }> | null>(null);
  const [cultivation, setCultivation] = useState<ServiceResult<CultivationStatusResponse> | null>(null);
  const [payment, setPayment] = useState<ServiceResult<FarmerPaymentDetailsResponse> | null>(null);

  useEffect(() => {
    let active = true;
    // Reset loading when the farmer changes; this synchronizes UI with an async
    // data fetch and is the intended use of an effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      getFarmerProfile(farmerId),
      verifyFarmerByNic(nic),
      getFarmerLands(farmerId),
      verifyActiveCultivation(farmerId),
      getFarmerPaymentDetails(farmerId),
    ]).then(([p, v, l, c, pay]) => {
      if (!active) return;
      setProfile(p);
      setVerification(v);
      setLands(l);
      setCultivation(c);
      setPayment(pay);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [farmerId, nic]);

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Your verified identity, farmer registration, land parcels, and payment account."
        crumbs={[{ title: "Farmer" }, { title: "Profile" }]}
      />

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Where this data comes from"
        description="Identity, registration, land, cultivation, and bank details are provided by GovTech sandbox APIs that are backend-only. In this frontend-only prototype they are shown as clearly-labelled demonstration data."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                Identity & registration
                {verification?.data.isRegisteredFarmer && (
                  <Tag color="green" icon={<BadgeCheck size={12} />}>
                    Registered farmer
                  </Tag>
                )}
              </Space>
            }
            extra={profile && <SourceTag source={profile.source} note={profile.note} />}
            className="agri-card-shadow h-full"
          >
            {loading || !profile ? (
              <Skeleton active />
            ) : (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Full name">{profile.data.fullName}</Descriptions.Item>
                <Descriptions.Item label="NIC">{profile.data.nic}</Descriptions.Item>
                <Descriptions.Item label="Farmer ID">{profile.data.farmerId}</Descriptions.Item>
                <Descriptions.Item label="Date of birth">{profile.data.dob}</Descriptions.Item>
                <Descriptions.Item label="Gender">{profile.data.gender}</Descriptions.Item>
                <Descriptions.Item label="Mobile">{profile.data.mobile}</Descriptions.Item>
                <Descriptions.Item label="Address">{profile.data.address}</Descriptions.Item>
                <Descriptions.Item label="Registration status">
                  <Tag color={verification?.data.farmerStatus === "ACTIVE" ? "green" : "default"}>
                    {verification?.data.farmerStatus ?? "UNKNOWN"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Cultivation & payment account"
            extra={cultivation && <SourceTag source={cultivation.source} note={cultivation.note} />}
            className="agri-card-shadow h-full"
          >
            {loading || !cultivation || !payment ? (
              <Skeleton active />
            ) : (
              <Space direction="vertical" className="w-full" size="middle">
                <Descriptions column={1} size="small" title="Current cultivation">
                  <Descriptions.Item label="Season">{cultivation.data.season}</Descriptions.Item>
                  <Descriptions.Item label="Actively cultivating">
                    <Tag color={cultivation.data.isCultivating ? "green" : "red"}>
                      {cultivation.data.isCultivating ? "Yes" : "No"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Primary crop">{cultivation.data.crop}</Descriptions.Item>
                </Descriptions>

                <Descriptions
                  column={1}
                  size="small"
                  title={
                    <Space>
                      <Landmark size={15} /> Payment account
                    </Space>
                  }
                >
                  <Descriptions.Item label="Bank">{payment.data.bankName}</Descriptions.Item>
                  <Descriptions.Item label="Account (masked)">
                    {payment.data.accountNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={payment.data.accountStatus === "ACTIVE" ? "green" : "default"}>
                      {payment.data.accountStatus}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="Registered land parcels"
        extra={lands && <SourceTag source={lands.source} note={lands.note} />}
        className="agri-card-shadow mt-4"
      >
        <Table<LandDetail>
          rowKey="landId"
          loading={loading}
          dataSource={lands?.data.lands ?? []}
          pagination={false}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Parcel ID", dataIndex: "landId" },
            { title: "Type", dataIndex: "landType" },
            {
              title: "Extent",
              dataIndex: "extent",
              render: (_, r) => `${r.extent} ${r.unit}`,
            },
            { title: "Crop", dataIndex: "cropType" },
            { title: "Location", dataIndex: "location" },
            { title: "District", dataIndex: "district" },
          ]}
        />
        <Typography.Text type="secondary" className="mt-2 block text-xs">
          Total declared extent:{" "}
          {formatExtent((lands?.data.lands ?? []).reduce((s, l) => s + l.extent, 0))}
        </Typography.Text>
      </Card>
    </div>
  );
}
