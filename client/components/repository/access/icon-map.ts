import {
    Cable,
    Wifi,
    Server,
    Monitor,
    PhoneCall,
    Phone,
    Camera,
    HardDrive,
    Siren,
    Flame,
    Shield,
    Timer,
    Mic,
    Tv,
    Smartphone,
    Square,
    LucideIcon,
} from "lucide-react";

export const ACCESS_TYPES = [
    { value: "switch", label: "Switch", icon: Cable },
    { value: "router", label: "Router", icon: Wifi },
    { value: "servidor", label: "Servidor", icon: Server },
    { value: "monitor", label: "Monitor", icon: Monitor },
    { value: "pbx", label: "PBX", icon: PhoneCall },
    { value: "telefono", label: "Teléfono", icon: Phone },
    { value: "camara", label: "Cámara", icon: Camera },
    { value: "dvr", label: "DVR / NVR", icon: HardDrive },
    { value: "alarma", label: "Alarma", icon: Siren },
    { value: "incendio", label: "Alarma Incendio", icon: Flame },
    { value: "firewall", label: "Firewall", icon: Shield },
    { value: "reloj", label: "Reloj", icon: Timer },
    { value: "portero", label: "Portero", icon: Mic },
    { value: "pantalla", label: "Pantalla", icon: Tv },
    { value: "celular", label: "Celular", icon: Smartphone },
] as const;

export const getAccessIcon = (type: string): LucideIcon => {
    const found = ACCESS_TYPES.find((t) => t.value === type);
    return found ? found.icon : Square;
};

export const getAccessLabel = (type: string): string => {
    const found = ACCESS_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
};
