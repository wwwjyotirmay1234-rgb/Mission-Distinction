import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListAnnouncements, useDeleteAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Search, Plus, MoreVertical, Trash2, Megaphone, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useListAnnouncements(
    {},
    { query: { queryKey: getListAnnouncementsQueryKey() } }
  );

  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDelete = (id: number) => {
    deleteAnnouncement.mutate({ id }, {
      onSuccess: () => {
        toast.success("Announcement deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Broadcast messages to all users.</p>
        </div>
        <div className="flex gap-2">
          <Button><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/40">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border/40">
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                     <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-full max-w-md" /></TableCell>
                     <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !announcements || announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No announcements found.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow key={announcement.id} className="border-border/40 hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1">
                          <Bell size={14} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{announcement.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-lg">{announcement.content}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        uppercase text-[10px] tracking-wider
                        ${announcement.type === 'alert' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 
                          announcement.type === 'event' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                          'border-primary/30 text-primary bg-primary/5'}
                      `}>
                        {announcement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(announcement.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
