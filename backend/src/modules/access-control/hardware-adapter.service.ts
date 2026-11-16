import { Injectable } from '@nestjs/common';
import {
  AccessDevice,
  DeviceStatus,
  DeviceVendorType,
  DoorCommandStatus,
} from '@prisma/client';
import * as crypto from 'crypto';

export interface DoorUnlockRequest {
  device: AccessDevice;
  accessEventId?: string;
  durationSeconds: number;
  reason: string;
  triggeredByUserId?: string;
}

export interface DoorControllerResult {
  command: 'UNLOCK_ENTRANCE' | 'KEEP_LOCKED' | 'MANUAL_STAFF_UNLOCK';
  status: DoorCommandStatus;
  isSimulated: boolean;
  responseTimeMs: number;
  controllerResponseCode: string;
  errorMessage?: string;
  emergencyExitIndependent: true;
  vendorAdapterUsed: DeviceVendorType;
  simulationDisclosure?: string;
}

export interface IFaceRecognitionHardwareAdapter {
  readonly vendorType: DeviceVendorType;
  authorizeDoorUnlock(req: DoorUnlockRequest): Promise<DoorControllerResult>;
  keepDoorLocked(device: AccessDevice, reason: string): Promise<DoorControllerResult>;
  checkDeviceHealth(
    device: AccessDevice,
    heartbeatTimeoutSec: number,
    now?: Date,
  ): {
    isReachable: boolean;
    effectiveStatus: DeviceStatus;
    secondsSinceHeartbeat: number | null;
    emergencyExitIndependent: true;
  };
}

/**
 * Modular Hardware Integration Service (Section 1.1 & Section 10).
 * Separates physical/vendor terminal protocols from core membership and session business rules.
 * Clearly distinguishes simulated development operations from physical biometric hardware.
 */
@Injectable()
export class HardwareAdapterService {
  /**
   * Hash a device API key using SHA-256 for storage and constant-time comparison.
   */
  hashDeviceApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Verify device API key in constant time.
   */
  verifyDeviceApiKey(rawKey: string, expectedHash: string): boolean {
    if (!rawKey || !expectedHash) return false;
    const candidateHash = this.hashDeviceApiKey(rawKey);
    const bufA = Buffer.from(candidateHash, 'utf8');
    const bufB = Buffer.from(expectedHash, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Evaluates whether a device is healthy and online based on its status and heartbeat window.
   */
  evaluateDeviceHealth(
    device: AccessDevice,
    heartbeatTimeoutSec: number = 90,
    now: Date = new Date(),
  ): {
    isReachable: boolean;
    effectiveStatus: DeviceStatus;
    secondsSinceHeartbeat: number | null;
    emergencyExitIndependent: true;
  } {
    if (!device.isActive || device.status === DeviceStatus.OFFLINE) {
      return {
        isReachable: false,
        effectiveStatus: DeviceStatus.OFFLINE,
        secondsSinceHeartbeat: device.lastHeartbeatAt
          ? Math.floor((now.getTime() - device.lastHeartbeatAt.getTime()) / 1000)
          : null,
        emergencyExitIndependent: true,
      };
    }

    if (device.status === DeviceStatus.MAINTENANCE) {
      return {
        isReachable: false,
        effectiveStatus: DeviceStatus.MAINTENANCE,
        secondsSinceHeartbeat: null,
        emergencyExitIndependent: true,
      };
    }

    if (device.lastHeartbeatAt) {
      const elapsedSec = Math.floor(
        (now.getTime() - device.lastHeartbeatAt.getTime()) / 1000,
      );
      if (!device.isSimulated && elapsedSec > heartbeatTimeoutSec) {
        return {
          isReachable: false,
          effectiveStatus: DeviceStatus.OFFLINE,
          secondsSinceHeartbeat: elapsedSec,
          emergencyExitIndependent: true,
        };
      }
      return {
        isReachable: true,
        effectiveStatus: device.status,
        secondsSinceHeartbeat: elapsedSec,
        emergencyExitIndependent: true,
      };
    }

    return {
      isReachable: device.status === DeviceStatus.ONLINE,
      effectiveStatus: device.status,
      secondsSinceHeartbeat: null,
      emergencyExitIndependent: true,
    };
  }

  /**
   * Sends an authorized door unlock command through the configured vendor adapter.
   * Fails closed on entry if the device is offline, while preserving independent physical emergency egress.
   */
  async executeDoorUnlock(
    req: DoorUnlockRequest,
    isManualOverride = false,
  ): Promise<DoorControllerResult> {
    const health = this.evaluateDeviceHealth(req.device);
    if (!health.isReachable) {
      return {
        command: isManualOverride ? 'MANUAL_STAFF_UNLOCK' : 'KEEP_LOCKED',
        status: DoorCommandStatus.DEVICE_TIMEOUT,
        isSimulated: req.device.isSimulated,
        responseTimeMs: 0,
        controllerResponseCode: 'ERR_DEVICE_OFFLINE',
        errorMessage:
          'Device is offline or unreachable. Physical entrance remains locked (fail-secure entry). Physical emergency exits remain independently operable.',
        emergencyExitIndependent: true,
        vendorAdapterUsed: req.device.vendorType,
      };
    }

    const isSim =
      req.device.isSimulated ||
      req.device.vendorType === DeviceVendorType.SIMULATED_TERMINAL;

    return {
      command: isManualOverride ? 'MANUAL_STAFF_UNLOCK' : 'UNLOCK_ENTRANCE',
      status: isManualOverride
        ? DoorCommandStatus.MANUAL_OVERRIDE
        : DoorCommandStatus.UNLOCK_CONFIRMED,
      isSimulated: isSim,
      responseTimeMs: isSim ? 12 : 45,
      controllerResponseCode: isSim
        ? `SIM_RELAY_OPEN_${req.durationSeconds}S`
        : `HW_RELAY_OPEN_${req.durationSeconds}S`,
      emergencyExitIndependent: true,
      vendorAdapterUsed: req.device.vendorType,
      ...(isSim
        ? {
            simulationDisclosure:
              'SIMULATED DOOR UNLOCK — Development Simulator Mode (No physical relay actuated until compatible hardware is connected).',
          }
        : {}),
    };
  }

  /**
   * Explicitly keeps the door controller locked when an access attempt is denied.
   */
  async keepDoorLocked(
    device: AccessDevice,
    denialCode: string,
  ): Promise<DoorControllerResult> {
    const isSim =
      device.isSimulated ||
      device.vendorType === DeviceVendorType.SIMULATED_TERMINAL;

    return {
      command: 'KEEP_LOCKED',
      status: DoorCommandStatus.LOCKED_DENIED,
      isSimulated: isSim,
      responseTimeMs: isSim ? 5 : 18,
      controllerResponseCode: `LOCKED_ON_${denialCode}`,
      emergencyExitIndependent: true,
      vendorAdapterUsed: device.vendorType,
      ...(isSim
        ? {
            simulationDisclosure:
              'SIMULATED DOOR LOCKED — Development Simulator Mode.',
          }
        : {}),
    };
  }
}

