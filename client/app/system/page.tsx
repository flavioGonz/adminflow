"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Bell, Save, Settings, Database, Users, Edit, Lock, Search, Filter, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as GroupApi from "@/lib/api-groups";
import { Group } from "@/types/group";
import { ShinyText } from "@/components/ui/shiny-text";
import { API_URL } from "@/lib/http";
import { BackupManager } from "@/components/system/backup-manager";
import { DatabaseManager } from "@/components/system/database-manager";
import { MobileSystemView } from "@/components/system/mobile-system-view";
import UsersManagementPage, { UsersManagementRef } from "@/components/users/users-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "edit">("create");
  const [groupForm, setGroupForm] = useState({ name: "", slug: "", description: "" });
  const [focusedGroup, setFocusedGroup] = useState<Group | null>(null);
  const usersPageRef = useRef<UsersManagementRef>(null);

  const loadGroups = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/groups`);
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleMobileAction = (action: string) => {
    if (action === 'sensors') {
        window.dispatchEvent(new CustomEvent('show-permissions-modal'));
    } else if (action === 'notifications') {
        window.dispatchEvent(new CustomEvent("trigger-push-subscribe"));
    } else if (action === 'password') {
        toast.info("Función de cambio de clave en desarrollo para móvil.");
    }
  };

  return (
    <>
      <MobileSystemView onAction={handleMobileAction} />
      
      <div className="space-y-6 p-6 desktop-table-view">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900"><Settings className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-3xl font-bold"><ShinyText size="3xl" weight="bold">Sistema</ShinyText></h1>
              <p className="text-sm text-muted-foreground">Administración global de la plataforma</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8"><TabsTrigger value="users">Usuarios</TabsTrigger><TabsTrigger value="database">Base de Datos</TabsTrigger><TabsTrigger value="backups">Respaldos</TabsTrigger></TabsList>
          <TabsContent value="users">
             <UsersManagementPage ref={usersPageRef} />
          </TabsContent>
          <TabsContent value="database"><DatabaseManager /></TabsContent>
          <TabsContent value="backups"><BackupManager /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}
