/**
 * Hand-authored to match supabase/migrations. Once the Supabase project is
 * live, regenerate with `npm run db:types` and this file becomes generated.
 */

export type ToteStatus = "unclaimed" | "active" | "archived";

export type HouseholdRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  household_id: string | null;
  display_name: string | null;
  created_at: string;
}

export type CategoryRow = {
  id: string;
  household_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export type ToteRow = {
  id: string;
  household_id: string;
  code: string;
  status: ToteStatus;
  size_prefix: string | null;
  index_no: number | null;
  name: string | null;
  category_id: string | null;
  description: string | null;
  location: string | null;
  created_by: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ItemRow = {
  id: string;
  tote_id: string;
  name: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TotePhotoRow = {
  id: string;
  tote_id: string;
  storage_path: string;
  caption: string | null;
  is_primary: boolean;
  created_at: string;
}

export type SearchResultRow = {
  id: string;
  code: string;
  size_prefix: string | null;
  index_no: number | null;
  name: string | null;
  description: string | null;
  location: string | null;
  category_name: string | null;
  matched_items: string[];
  item_count: number;
}

/*
 * Rows are declared as type aliases rather than interfaces on purpose:
 * Supabase's GenericTable requires Record<string, unknown>, and only type
 * aliases get an implicit index signature. Interfaces here resolve to `never`.
 */
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<
  Row,
  Rels extends Relationship[] = [],
  Insert = Partial<Row>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rels;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      households: Table<HouseholdRow>;
      profiles: Table<
        ProfileRow,
        [
          {
            foreignKeyName: "profiles_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ]
      >;
      categories: Table<
        CategoryRow,
        [
          {
            foreignKeyName: "categories_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ]
      >;
      totes: Table<
        ToteRow,
        [
          {
            foreignKeyName: "totes_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "totes_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ]
      >;
      items: Table<
        ItemRow,
        [
          {
            foreignKeyName: "items_tote_id_fkey";
            columns: ["tote_id"];
            isOneToOne: false;
            referencedRelation: "totes";
            referencedColumns: ["id"];
          },
        ]
      >;
      tote_photos: Table<
        TotePhotoRow,
        [
          {
            foreignKeyName: "tote_photos_tote_id_fkey";
            columns: ["tote_id"];
            isOneToOne: false;
            referencedRelation: "totes";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      create_household: {
        Args: { p_name: string; p_display_name: string | null };
        Returns: string;
      };
      join_household: {
        Args: { p_invite_code: string; p_display_name: string | null };
        Returns: string;
      };
      mint_tote_codes: { Args: { p_count: number }; Returns: ToteRow[] };
      next_tote_index: { Args: { p_size_prefix: string }; Returns: number };
      search_totes: { Args: { q: string }; Returns: SearchResultRow[] };
      current_household_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: { tote_status: ToteStatus };
    CompositeTypes: { [_ in never]: never };
  };
}
