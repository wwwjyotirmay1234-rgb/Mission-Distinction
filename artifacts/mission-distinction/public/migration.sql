--
-- PostgreSQL database dump
--

\restrict CVT5fhCUdHQZKEQuAbbuNwgZvsIRZJtJdHYIsL0nsMPaeoV0fU6novdphLv8Xhh

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    score text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_id_seq OWNED BY public.activity.id;


--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    model text DEFAULT 'gpt-4o'::text NOT NULL,
    messages_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_chat_sessions_id_seq OWNED BY public.ai_chat_sessions.id;


--
-- Name: ai_revision_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_revision_items (
    id integer NOT NULL,
    book_id integer NOT NULL,
    subject text NOT NULL,
    chapter text NOT NULL,
    type text NOT NULL,
    title text,
    content text NOT NULL,
    generated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_revision_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_revision_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_revision_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_revision_items_id_seq OWNED BY public.ai_revision_items.id;


--
-- Name: anatomy_viva_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomy_viva_images (
    id integer NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    side text,
    region text,
    notes text,
    object_name text NOT NULL,
    source_file_name text NOT NULL,
    source_page integer,
    last_shown_at timestamp without time zone,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: anatomy_viva_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anatomy_viva_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anatomy_viva_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.anatomy_viva_images_id_seq OWNED BY public.anatomy_viva_images.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'announcement'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    attachment_url text,
    attachment_name text,
    attachment_type text,
    scheduled_for timestamp without time zone,
    delivered_count integer DEFAULT 0 NOT NULL,
    target_audience text DEFAULT 'all'::text NOT NULL
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: app_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_updates (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: app_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_updates_id_seq OWNED BY public.app_updates.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    admin_name text NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id integer,
    details jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookmarks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    resource_type text NOT NULL,
    resource_id integer NOT NULL,
    resource_title text NOT NULL,
    subject text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookmarks_id_seq OWNED BY public.bookmarks.id;


--
-- Name: books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    author text,
    url text NOT NULL,
    cover_url text,
    download_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer
);


--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    subject text,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    color text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: clinical_case_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_case_attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    case_id integer NOT NULL,
    answer_text text NOT NULL,
    ai_feedback jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    date_key text DEFAULT ''::text NOT NULL
);


--
-- Name: clinical_case_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_case_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_case_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_case_attempts_id_seq OWNED BY public.clinical_case_attempts.id;


--
-- Name: clinical_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_cases (
    id integer NOT NULL,
    scenario text NOT NULL,
    subject text NOT NULL,
    model_answer text NOT NULL,
    explanation text NOT NULL,
    date_assigned text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_grand_round boolean DEFAULT false NOT NULL,
    grand_round_week text,
    featured_attempt_id integer,
    winner_announced_at timestamp without time zone
);


--
-- Name: clinical_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_cases_id_seq OWNED BY public.clinical_cases.id;


--
-- Name: community_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_groups (
    id integer NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    member_count integer DEFAULT 0 NOT NULL,
    last_message text,
    last_message_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    description text,
    created_by integer,
    is_admin_created boolean DEFAULT false,
    cohort_year text,
    cohort_session_year text
);


--
-- Name: community_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_groups_id_seq OWNED BY public.community_groups.id;


--
-- Name: community_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_messages (
    id integer NOT NULL,
    group_id integer NOT NULL,
    sender_name text NOT NULL,
    sender_avatar_url text,
    content text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sender_id integer,
    file_url text,
    file_type text,
    file_name text,
    message_type text DEFAULT 'text'::text NOT NULL,
    rich_content text,
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    deleted_for_everyone boolean DEFAULT false,
    deleted_by text DEFAULT '[]'::text,
    seen_by text DEFAULT '[]'::text
);


--
-- Name: community_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_messages_id_seq OWNED BY public.community_messages.id;


--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    author_avatar_url text,
    group_name text,
    like_count integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    author_id integer,
    media_url text,
    media_type text,
    cohort_year text,
    cohort_session_year text
);


--
-- Name: community_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.community_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: community_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.community_posts_id_seq OWNED BY public.community_posts.id;


--
-- Name: confession_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.confession_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    confession_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: confession_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.confession_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: confession_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.confession_likes_id_seq OWNED BY public.confession_likes.id;


--
-- Name: confessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.confessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cohort_year text,
    cohort_session_year text
);


--
-- Name: confessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.confessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: confessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.confessions_id_seq OWNED BY public.confessions.id;


--
-- Name: content_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    content_type text NOT NULL,
    content_id integer NOT NULL,
    content_preview text,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: content_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_reports_id_seq OWNED BY public.content_reports.id;


--
-- Name: daily_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_questions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date_key text NOT NULL,
    subject text NOT NULL,
    question_json jsonb NOT NULL,
    answered boolean DEFAULT false NOT NULL,
    was_correct boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_questions_id_seq OWNED BY public.daily_questions.id;


--
-- Name: device_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_events (
    id integer NOT NULL,
    user_id integer,
    type text NOT NULL,
    platform text NOT NULL,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: device_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_events_id_seq OWNED BY public.device_events.id;


--
-- Name: doubt_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doubt_answers (
    id integer NOT NULL,
    doubt_id integer NOT NULL,
    user_id integer NOT NULL,
    author_name text NOT NULL,
    answer text NOT NULL,
    is_accepted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    is_ai_generated boolean DEFAULT false NOT NULL
);


--
-- Name: doubt_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doubt_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doubt_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doubt_answers_id_seq OWNED BY public.doubt_answers.id;


--
-- Name: doubts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doubts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    author_name text NOT NULL,
    subject text NOT NULL,
    title text NOT NULL,
    question text NOT NULL,
    answer_count integer DEFAULT 0 NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cohort_year text,
    cohort_session_year text
);


--
-- Name: doubts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doubts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doubts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doubts_id_seq OWNED BY public.doubts.id;


--
-- Name: email_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    type text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: email_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_tokens_id_seq OWNED BY public.email_tokens.id;


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id integer NOT NULL,
    user_id integer,
    title text NOT NULL,
    subject text NOT NULL,
    exam_date timestamp without time zone NOT NULL,
    description text,
    is_global boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    user_id integer,
    user_name text,
    user_email text,
    category text DEFAULT 'general'::text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    rating integer,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    admin_reply text,
    admin_reply_at timestamp without time zone
);


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: flashcard_decks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flashcard_decks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject text NOT NULL,
    title text NOT NULL,
    card_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_admin_shared boolean DEFAULT false NOT NULL
);


--
-- Name: flashcard_decks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flashcard_decks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flashcard_decks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flashcard_decks_id_seq OWNED BY public.flashcard_decks.id;


--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flashcards (
    id integer NOT NULL,
    deck_id integer NOT NULL,
    user_id integer NOT NULL,
    front text NOT NULL,
    back text NOT NULL,
    next_review timestamp without time zone DEFAULT now() NOT NULL,
    ease real DEFAULT 2.5 NOT NULL,
    "interval" integer DEFAULT 1 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: flashcards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flashcards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flashcards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flashcards_id_seq OWNED BY public.flashcards.id;


--
-- Name: grand_test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grand_test_answers (
    id integer NOT NULL,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text DEFAULT ''::text NOT NULL,
    ai_marks integer,
    ai_feedback text,
    ai_key_points_covered text,
    ai_key_points_missed text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    answer_image_url text
);


--
-- Name: grand_test_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grand_test_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grand_test_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grand_test_answers_id_seq OWNED BY public.grand_test_answers.id;


--
-- Name: grand_test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grand_test_questions (
    id integer NOT NULL,
    test_id integer NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'long'::text NOT NULL,
    max_marks integer DEFAULT 10 NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    model_answer text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grand_test_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grand_test_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grand_test_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grand_test_questions_id_seq OWNED BY public.grand_test_questions.id;


--
-- Name: grand_test_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grand_test_submissions (
    id integer NOT NULL,
    test_id integer NOT NULL,
    user_id integer NOT NULL,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    submitted_at timestamp without time zone,
    total_marks_obtained integer,
    total_marks_possible integer,
    status text DEFAULT 'in_progress'::text NOT NULL,
    ai_overall_feedback text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grand_test_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grand_test_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grand_test_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grand_test_submissions_id_seq OWNED BY public.grand_test_submissions.id;


--
-- Name: grand_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grand_tests (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 180 NOT NULL,
    available_from timestamp without time zone,
    available_until timestamp without time zone,
    is_published boolean DEFAULT false NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grand_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grand_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grand_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grand_tests_id_seq OWNED BY public.grand_tests.id;


--
-- Name: group_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_invites (
    id integer NOT NULL,
    group_id integer NOT NULL,
    inviter_id integer NOT NULL,
    inviter_name text NOT NULL,
    invitee_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: group_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_invites_id_seq OWNED BY public.group_invites.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: mnemonic_upvotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mnemonic_upvotes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    mnemonic_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mnemonic_upvotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mnemonic_upvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mnemonic_upvotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mnemonic_upvotes_id_seq OWNED BY public.mnemonic_upvotes.id;


--
-- Name: mnemonics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mnemonics (
    id integer NOT NULL,
    user_id integer NOT NULL,
    author_name text NOT NULL,
    subject text NOT NULL,
    topic text NOT NULL,
    mnemonic text NOT NULL,
    description text,
    upvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_admin_shared boolean DEFAULT false NOT NULL
);


--
-- Name: mnemonics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mnemonics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mnemonics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mnemonics_id_seq OWNED BY public.mnemonics.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    content text,
    download_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    created_by integer,
    file_url text,
    file_type text
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: pdfs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdfs (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    professor text,
    year text,
    url text NOT NULL,
    thumbnail_url text,
    download_count integer DEFAULT 0 NOT NULL,
    pages integer,
    size text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer
);


--
-- Name: pdfs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pdfs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdfs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pdfs_id_seq OWNED BY public.pdfs.id;


--
-- Name: photo_doubts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_doubts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    image_url text NOT NULL,
    question text,
    ai_explanation text NOT NULL,
    subject text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: photo_doubts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_doubts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_doubts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_doubts_id_seq OWNED BY public.photo_doubts.id;


--
-- Name: pinned_notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pinned_notices (
    id integer NOT NULL,
    created_by integer NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pinned_notices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pinned_notices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pinned_notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pinned_notices_id_seq OWNED BY public.pinned_notices.id;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    author text NOT NULL,
    author_avatar_url text,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    emoji text DEFAULT '❤️'::text NOT NULL
);


--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: proctoring_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proctoring_logs (
    id integer NOT NULL,
    session_id text NOT NULL,
    user_id integer NOT NULL,
    quiz_id integer NOT NULL,
    attempt_id integer,
    event_type text NOT NULL,
    details jsonb,
    ai_analysis text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: proctoring_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proctoring_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proctoring_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proctoring_logs_id_seq OWNED BY public.proctoring_logs.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: pyq_insights_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pyq_insights_cache (
    id integer NOT NULL,
    user_id integer NOT NULL,
    insights_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    generated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pyq_insights_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pyq_insights_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pyq_insights_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pyq_insights_cache_id_seq OWNED BY public.pyq_insights_cache.id;


--
-- Name: pyqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pyqs (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    year text NOT NULL,
    url text NOT NULL,
    download_count integer DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    college text DEFAULT 'VIMSAR'::text NOT NULL,
    topic_tags text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- Name: pyqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pyqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pyqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pyqs_id_seq OWNED BY public.pyqs.id;


--
-- Name: question_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_reports (
    id integer NOT NULL,
    user_id integer NOT NULL,
    question_id integer NOT NULL,
    quiz_id integer NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: question_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_reports_id_seq OWNED BY public.question_reports.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    text text NOT NULL,
    options jsonb,
    correct_option integer,
    explanation text,
    question_type text DEFAULT 'mcq'::text NOT NULL,
    correct_answer text,
    max_marks integer DEFAULT 5,
    model_answer text,
    topic_tags text[]
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_answers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    quiz_id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    subject text NOT NULL,
    question_type text NOT NULL,
    correct boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_answers_id_seq OWNED BY public.quiz_answers.id;


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    quiz_id integer NOT NULL,
    quiz_title text NOT NULL,
    subject text NOT NULL,
    score integer NOT NULL,
    total integer NOT NULL,
    percentage integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    has_pending boolean DEFAULT false,
    violation_count integer DEFAULT 0,
    is_flagged boolean DEFAULT false,
    proctoring_session_id text,
    proctoring_flagged_at timestamp without time zone
);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_attempts_id_seq OWNED BY public.quiz_attempts.id;


--
-- Name: quiz_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    quiz_id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    answer_image_url text,
    max_marks integer DEFAULT 5 NOT NULL,
    ai_marks integer,
    ai_feedback text,
    admin_marks integer,
    admin_feedback text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    graded_at timestamp without time zone,
    ai_lacking text,
    admin_lacking text
);


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_submissions_id_seq OWNED BY public.quiz_submissions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    description text,
    question_count integer DEFAULT 0 NOT NULL,
    difficulty text DEFAULT 'medium'::text NOT NULL,
    duration_minutes integer,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_proctored boolean DEFAULT false NOT NULL
);


--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: rank_unlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rank_unlocks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    rank_name text NOT NULL,
    level integer NOT NULL,
    xp_at_unlock integer NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: rank_unlocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rank_unlocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rank_unlocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rank_unlocks_id_seq OWNED BY public.rank_unlocks.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: student_note_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_note_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_type text DEFAULT 'pdf'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    xp_awarded boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: student_note_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_note_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_note_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_note_submissions_id_seq OWNED BY public.student_note_submissions.id;


--
-- Name: student_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    user_college text,
    type text NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    year text,
    url text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by integer,
    reviewed_by_name text,
    rejection_reason text,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: student_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_submissions_id_seq OWNED BY public.student_submissions.id;


--
-- Name: student_warnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_warnings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    issued_by integer NOT NULL,
    issued_by_name text NOT NULL,
    reason text NOT NULL,
    severity text DEFAULT 'warning'::text NOT NULL,
    seen_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: student_warnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_warnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_warnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_warnings_id_seq OWNED BY public.student_warnings.id;


--
-- Name: study_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_plans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    target_date text,
    plan_json jsonb NOT NULL,
    weak_subjects jsonb,
    generated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: study_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: study_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_plans_id_seq OWNED BY public.study_plans.id;


--
-- Name: study_room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_room_members (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    last_heartbeat timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: study_room_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_room_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: study_room_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_room_members_id_seq OWNED BY public.study_room_members.id;


--
-- Name: study_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_rooms (
    id integer NOT NULL,
    host_id integer NOT NULL,
    host_name text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    timer_minutes integer DEFAULT 25 NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    started_at timestamp without time zone,
    ends_at timestamp without time zone,
    member_count integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cohort_year text,
    cohort_session_year text
);


--
-- Name: study_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: study_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_rooms_id_seq OWNED BY public.study_rooms.id;


--
-- Name: study_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject text DEFAULT 'General'::text NOT NULL,
    duration_minutes integer NOT NULL,
    session_type text DEFAULT 'pomodoro'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: study_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: study_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_sessions_id_seq OWNED BY public.study_sessions.id;


--
-- Name: teach_back_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teach_back_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    topic text NOT NULL,
    subject text NOT NULL,
    transcript text,
    score integer,
    feedback_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: teach_back_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teach_back_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teach_back_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teach_back_sessions_id_seq OWNED BY public.teach_back_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    mobile_number text,
    password_hash text NOT NULL,
    role text DEFAULT 'student'::text NOT NULL,
    year text,
    college text,
    avatar_url text,
    study_streak integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    last_streak_date text,
    is_super_admin boolean DEFAULT false NOT NULL,
    banned_at timestamp without time zone,
    ban_reason text,
    total_xp integer DEFAULT 0 NOT NULL,
    current_rank integer DEFAULT 1 NOT NULL,
    session_year text,
    last_seen_app_update_at timestamp without time zone DEFAULT now(),
    weekly_digest_opt_in boolean DEFAULT false NOT NULL,
    linked_student_id integer
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: viva_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject text NOT NULL,
    viva_type text,
    image_id integer,
    score integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: viva_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.viva_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: viva_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.viva_history_id_seq OWNED BY public.viva_history.id;


--
-- Name: viva_room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_room_members (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    last_heartbeat timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: viva_room_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.viva_room_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: viva_room_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.viva_room_members_id_seq OWNED BY public.viva_room_members.id;


--
-- Name: viva_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_rooms (
    id integer NOT NULL,
    host_id integer NOT NULL,
    host_name text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    member_count integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: viva_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.viva_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: viva_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.viva_rooms_id_seq OWNED BY public.viva_rooms.id;


--
-- Name: viva_source_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_source_documents (
    id integer NOT NULL,
    subject text NOT NULL,
    file_name text NOT NULL,
    full_text text NOT NULL,
    char_count integer NOT NULL,
    pages integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: viva_source_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.viva_source_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: viva_source_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.viva_source_documents_id_seq OWNED BY public.viva_source_documents.id;


--
-- Name: viva_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_sources (
    id integer NOT NULL,
    subject text NOT NULL,
    source_text text,
    updated_by integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: viva_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.viva_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: viva_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.viva_sources_id_seq OWNED BY public.viva_sources.id;


--
-- Name: xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.xp_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.xp_transactions_id_seq OWNED BY public.xp_transactions.id;


--
-- Name: activity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity ALTER COLUMN id SET DEFAULT nextval('public.activity_id_seq'::regclass);


--
-- Name: ai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_sessions_id_seq'::regclass);


--
-- Name: ai_revision_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_revision_items ALTER COLUMN id SET DEFAULT nextval('public.ai_revision_items_id_seq'::regclass);


--
-- Name: anatomy_viva_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomy_viva_images ALTER COLUMN id SET DEFAULT nextval('public.anatomy_viva_images_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: app_updates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_updates ALTER COLUMN id SET DEFAULT nextval('public.app_updates_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: bookmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks ALTER COLUMN id SET DEFAULT nextval('public.bookmarks_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: clinical_case_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_case_attempts ALTER COLUMN id SET DEFAULT nextval('public.clinical_case_attempts_id_seq'::regclass);


--
-- Name: clinical_cases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_cases ALTER COLUMN id SET DEFAULT nextval('public.clinical_cases_id_seq'::regclass);


--
-- Name: community_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_groups ALTER COLUMN id SET DEFAULT nextval('public.community_groups_id_seq'::regclass);


--
-- Name: community_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_messages ALTER COLUMN id SET DEFAULT nextval('public.community_messages_id_seq'::regclass);


--
-- Name: community_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_posts ALTER COLUMN id SET DEFAULT nextval('public.community_posts_id_seq'::regclass);


--
-- Name: confession_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confession_likes ALTER COLUMN id SET DEFAULT nextval('public.confession_likes_id_seq'::regclass);


--
-- Name: confessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confessions ALTER COLUMN id SET DEFAULT nextval('public.confessions_id_seq'::regclass);


--
-- Name: content_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports ALTER COLUMN id SET DEFAULT nextval('public.content_reports_id_seq'::regclass);


--
-- Name: daily_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_questions ALTER COLUMN id SET DEFAULT nextval('public.daily_questions_id_seq'::regclass);


--
-- Name: device_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_events ALTER COLUMN id SET DEFAULT nextval('public.device_events_id_seq'::regclass);


--
-- Name: doubt_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answers ALTER COLUMN id SET DEFAULT nextval('public.doubt_answers_id_seq'::regclass);


--
-- Name: doubts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubts ALTER COLUMN id SET DEFAULT nextval('public.doubts_id_seq'::regclass);


--
-- Name: email_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens ALTER COLUMN id SET DEFAULT nextval('public.email_tokens_id_seq'::regclass);


--
-- Name: exams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: flashcard_decks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcard_decks ALTER COLUMN id SET DEFAULT nextval('public.flashcard_decks_id_seq'::regclass);


--
-- Name: flashcards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcards ALTER COLUMN id SET DEFAULT nextval('public.flashcards_id_seq'::regclass);


--
-- Name: grand_test_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_answers ALTER COLUMN id SET DEFAULT nextval('public.grand_test_answers_id_seq'::regclass);


--
-- Name: grand_test_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_questions ALTER COLUMN id SET DEFAULT nextval('public.grand_test_questions_id_seq'::regclass);


--
-- Name: grand_test_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_submissions ALTER COLUMN id SET DEFAULT nextval('public.grand_test_submissions_id_seq'::regclass);


--
-- Name: grand_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_tests ALTER COLUMN id SET DEFAULT nextval('public.grand_tests_id_seq'::regclass);


--
-- Name: group_invites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites ALTER COLUMN id SET DEFAULT nextval('public.group_invites_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: mnemonic_upvotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mnemonic_upvotes ALTER COLUMN id SET DEFAULT nextval('public.mnemonic_upvotes_id_seq'::regclass);


--
-- Name: mnemonics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mnemonics ALTER COLUMN id SET DEFAULT nextval('public.mnemonics_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: pdfs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdfs ALTER COLUMN id SET DEFAULT nextval('public.pdfs_id_seq'::regclass);


--
-- Name: photo_doubts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_doubts ALTER COLUMN id SET DEFAULT nextval('public.photo_doubts_id_seq'::regclass);


--
-- Name: pinned_notices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_notices ALTER COLUMN id SET DEFAULT nextval('public.pinned_notices_id_seq'::regclass);


--
-- Name: post_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: proctoring_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_logs ALTER COLUMN id SET DEFAULT nextval('public.proctoring_logs_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: pyq_insights_cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pyq_insights_cache ALTER COLUMN id SET DEFAULT nextval('public.pyq_insights_cache_id_seq'::regclass);


--
-- Name: pyqs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pyqs ALTER COLUMN id SET DEFAULT nextval('public.pyqs_id_seq'::regclass);


--
-- Name: question_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_reports ALTER COLUMN id SET DEFAULT nextval('public.question_reports_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.quiz_answers_id_seq'::regclass);


--
-- Name: quiz_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempts_id_seq'::regclass);


--
-- Name: quiz_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_submissions ALTER COLUMN id SET DEFAULT nextval('public.quiz_submissions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: rank_unlocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rank_unlocks ALTER COLUMN id SET DEFAULT nextval('public.rank_unlocks_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: student_note_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_note_submissions ALTER COLUMN id SET DEFAULT nextval('public.student_note_submissions_id_seq'::regclass);


--
-- Name: student_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_submissions ALTER COLUMN id SET DEFAULT nextval('public.student_submissions_id_seq'::regclass);


--
-- Name: student_warnings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_warnings ALTER COLUMN id SET DEFAULT nextval('public.student_warnings_id_seq'::regclass);


--
-- Name: study_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans ALTER COLUMN id SET DEFAULT nextval('public.study_plans_id_seq'::regclass);


--
-- Name: study_room_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_room_members ALTER COLUMN id SET DEFAULT nextval('public.study_room_members_id_seq'::regclass);


--
-- Name: study_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_rooms ALTER COLUMN id SET DEFAULT nextval('public.study_rooms_id_seq'::regclass);


--
-- Name: study_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_sessions ALTER COLUMN id SET DEFAULT nextval('public.study_sessions_id_seq'::regclass);


--
-- Name: teach_back_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teach_back_sessions ALTER COLUMN id SET DEFAULT nextval('public.teach_back_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: viva_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_history ALTER COLUMN id SET DEFAULT nextval('public.viva_history_id_seq'::regclass);


--
-- Name: viva_room_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_room_members ALTER COLUMN id SET DEFAULT nextval('public.viva_room_members_id_seq'::regclass);


--
-- Name: viva_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_rooms ALTER COLUMN id SET DEFAULT nextval('public.viva_rooms_id_seq'::regclass);


--
-- Name: viva_source_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_source_documents ALTER COLUMN id SET DEFAULT nextval('public.viva_source_documents_id_seq'::regclass);


--
-- Name: viva_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_sources ALTER COLUMN id SET DEFAULT nextval('public.viva_sources_id_seq'::regclass);


--
-- Name: xp_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions ALTER COLUMN id SET DEFAULT nextval('public.xp_transactions_id_seq'::regclass);


--
-- Data for Name: activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity (id, user_id, type, description, score, created_at) FROM stdin;
1	20	pdf	Downloaded PDF: Anatomy of Thorax Questions	\N	2026-06-17 03:40:42.923256
2	20	pdf	Downloaded PDF: Biochemistry Questions answer part 2	\N	2026-06-17 03:41:04.347449
\.


--
-- Data for Name: ai_chat_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_chat_sessions (id, user_id, title, model, messages_json, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_revision_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_revision_items (id, book_id, subject, chapter, type, title, content, generated_at) FROM stdin;
\.


--
-- Data for Name: anatomy_viva_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anatomy_viva_images (id, category, title, side, region, notes, object_name, source_file_name, source_page, last_shown_at, created_by, created_at) FROM stdin;
869	Section Anatomy	Sagittal section through the pelvis of a newborn	\N	\N	\N	anatomy-viva-images/1783405962482_manual_manual.png	manual	1226	\N	6	2026-07-07 06:32:43.416566
870	Section Anatomy	Coronal section of rectum and anal canal	\N	\N	\N	anatomy-viva-images/1783406035640_manual_manual.png	manual	1179	\N	6	2026-07-07 06:33:57.393923
717	Bone	Left Elbow Joint, AP view	Left	Elbow	The X-ray displays the humeroulnar and humeroradial joints, with clear views of the olecranon process and radial head.	anatomy-viva-images/1783372512940_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	4	\N	6	2026-07-06 21:15:13.757233
843	Section Anatomy	Section of the spleen, showing the termination of the small blood vessels	\N	\N	\N	anatomy-viva-images/1783404981439_manual_manual.png	manual	1282	\N	6	2026-07-07 06:16:22.355261
871	Section Anatomy	Coronal section of rectum and anal canal	\N	\N	\N	anatomy-viva-images/1783406121665_manual_manual.png	manual	1179	\N	6	2026-07-07 06:35:22.594531
872	Section Anatomy	Section of mucous membrane of human rectum	\N	\N	\N	anatomy-viva-images/1783406130087_manual_manual.png	manual	1181	\N	6	2026-07-07 06:35:31.092751
873	Section Anatomy	Coronal section through the anal canal	\N	\N	\N	anatomy-viva-images/1783406138265_manual_manual.png	manual	1180	\N	6	2026-07-07 06:35:39.216547
874	Section Anatomy	Transverse section of human vermiform process	\N	\N	\N	anatomy-viva-images/1783406146317_manual_manual.png	manual	1175	\N	6	2026-07-07 06:35:47.226489
875	Section Anatomy	Gastric glands	\N	\N	\N	anatomy-viva-images/1783406163182_manual_manual.png	manual	1163	\N	6	2026-07-07 06:36:04.080894
97	Histology	Submandibular Gland	\N	Head and Neck	\N	anatomy-viva-images/1783347521679_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	38	\N	6	2026-07-06 14:18:42.527525
98	Histology	Parotid Gland	\N	Head and Neck	\N	anatomy-viva-images/1783347532631_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	37	\N	6	2026-07-06 14:18:53.569793
876	Section Anatomy	Section of mucous membrane of human stomach	\N	\N	\N	anatomy-viva-images/1783406175265_manual_manual.png	manual	1162	\N	6	2026-07-07 06:36:16.057265
877	Section Anatomy	Transverse section of a villus, from the human intestine	\N	\N	\N	anatomy-viva-images/1783406183207_manual_manual.png	manual	1168	\N	6	2026-07-07 06:36:24.224301
47	Prosection	Axilla - Brachial Plexus, Axillary Vessels	Right	Upper Limb	AI-cleaned web-sourced image (labels removed)	anatomy-viva-images/1783316127060_upper_limb_1_axilla_edited.png	web-sourced-cleaned-axilla.png	\N	2026-07-06 20:28:43.906	\N	2026-07-06 05:35:48.158184
51	Histology	Trachea	\N	Thorax	Trachea is lined by pseudostratified ciliated columnar epithelium with goblet cells and has a thick basement membrane. The submucosa contains seromucous glands, and the wall is supported by C-shaped hyaline cartilage rings bridged posteriorly by trachealis muscle. An outer adventitia of fibroelastic connective tissue contains vessels and nerves.	anatomy-viva-images/1783346045431_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	2	2026-07-06 19:26:35.489	6	2026-07-06 13:54:07.135661
53	Histology	Tongue (Circumvallate Papillae)	\N	Head and Neck	Circumvallate papillae are lined by stratified squamous non-keratinized epithelium, with numerous pale barrel-shaped taste buds in the lateral walls facing the trench. Deep to the papilla are purely serous von Ebner glands opening into the trench, and the core contains lamina propria over interlacing skeletal muscle bundles.	anatomy-viva-images/1783346058500_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	4	2026-07-06 20:34:19.019	6	2026-07-06 13:54:19.319499
50	Prosection	Posterior Triangle of Neck - Cervical Plexus and Accessory Nerve	Right	Neck	AI-cleaned web-sourced image (labels removed)	anatomy-viva-images/1783316130997_neck_2_teachmeanatomy_edited.png	web-sourced-cleaned-posterior-triangle.png	\N	\N	\N	2026-07-06 05:35:48.650033
878	Section Anatomy	Interior of the stomach	\N	\N	\N	anatomy-viva-images/1783406190732_manual_manual.png	manual	1160	\N	6	2026-07-07 06:36:31.448043
99	Histology	Palatine Tonsil	\N	Head and Neck	\N	anatomy-viva-images/1783347540356_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	36	\N	6	2026-07-06 14:19:01.169315
100	Histology	Urinary Bladder	\N	Pelvis	\N	anatomy-viva-images/1783347548466_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	24	\N	6	2026-07-06 14:19:09.410814
101	Histology	Ureter	\N	Abdomen	\N	anatomy-viva-images/1783347557202_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	23	\N	6	2026-07-06 14:19:18.110323
785	Bone	Right Humerus, Anterior view	Right	Humerus	The humerus is a long bone with a proximal head, greater and lesser tubercles, and a distal end featuring the capitulum and trochlea.	anatomy-viva-images/1783373184144_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	4	\N	6	2026-07-06 21:26:24.921731
102	Histology	Ileum	\N	Abdomen	\N	anatomy-viva-images/1783347565445_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	12	\N	6	2026-07-06 14:19:26.252443
786	Bone	Right Humerus, Posterior view	Right	Humerus	The humerus is a long bone with a proximal head, greater and lesser tubercles, and a distal end featuring the capitulum and trochlea.	anatomy-viva-images/1783373184970_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	4	\N	6	2026-07-06 21:26:25.648966
879	Section Anatomy	Duodenojejunal fossa	\N	\N	\N	anatomy-viva-images/1783406199672_manual_manual.png	manual	1155	\N	6	2026-07-07 06:36:40.608573
880	Section Anatomy	Horizontal disposition of the peritoneum in the upper abdomen	\N	\N	\N	anatomy-viva-images/1783406206842_manual_manual.png	manual	1151	\N	6	2026-07-07 06:36:47.763562
134	Bone	Inferior view of Skull (Norma Basalis)	Median	Cranial	Illustration of the skull base showing foramina and canals such as the foramen magnum and carotid canal.	anatomy-viva-images/1783360346846_28_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	28	\N	68	2026-07-06 17:52:27.831115
787	Bone	Right Humerus, Proximal end view	Right	Humerus	The humerus is a long bone with a proximal head, greater and lesser tubercles, and a distal end featuring the capitulum and trochlea.	anatomy-viva-images/1783373185673_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	4	\N	6	2026-07-06 21:26:26.188789
48	Prosection	Brachial Plexus - Cords and Trunks	Right	Upper Limb	AI-cleaned web-sourced image (labels removed)	anatomy-viva-images/1783316129039_upper_limb_2_plexus_edited.png	web-sourced-cleaned-plexus.png	\N	2026-07-07 05:51:58.666	\N	2026-07-06 05:35:48.630506
881	Section Anatomy	Transverse section of the abdomen	\N	\N	\N	anatomy-viva-images/1783406215702_manual_manual.png	manual	1154	\N	6	2026-07-07 06:36:56.696628
56	Histology	C-O Junction	\N	Abdomen	Shows an abrupt transition from stratified squamous non-keratinized epithelium of the esophagus to simple columnar epithelium of the gastric cardia. Cardiac mucous glands and gastric pits appear on the stomach side, while esophageal submucosal glands disappear. The inner circular muscle thickens here, contributing to the lower esophageal sphincter.	anatomy-viva-images/1783346075076_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	7	\N	6	2026-07-06 13:54:35.873195
57	Histology	Fundus of Stomach	\N	Abdomen	Fundus of stomach is lined by simple columnar mucus-secreting epithelium. The lamina propria contains long, straight parallel gastric glands opening into gastric pits, with chief (peptic) cells deep in the glands secreting pepsinogen. A distinct muscularis mucosa separates mucosa from submucosa, and the muscularis externa has three layers: inner oblique, middle circular, and outer longitudinal.	anatomy-viva-images/1783346081186_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	8	\N	6	2026-07-06 13:54:42.031209
58	Histology	Pylorus of Stomach	\N	Abdomen	Pylorus is lined by tall simple columnar epithelium and has deep, wide gastric pits occupying nearly half the mucosal thickness. The lamina propria contains short, highly branched coiled pyloric glands, and the middle circular layer of muscularis externa is thickened to form the pyloric sphincter. It lacks villi and submucosal glands.	anatomy-viva-images/1783346090533_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	9	\N	6	2026-07-06 13:54:51.441618
59	Histology	Duodenum	\N	Abdomen	Duodenum is lined by simple columnar epithelium and shows finger-like villi with crypts. The submucosa contains characteristic Brunner's glands; goblet cells are present and Paneth cells are seen at the bases of crypts. Muscularis externa has inner circular and outer longitudinal smooth muscle layers.	anatomy-viva-images/1783346097179_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	10	\N	6	2026-07-06 13:54:58.088187
60	Histology	Jejunum	\N	Abdomen	Jejunal mucosa is lined by simple columnar epithelium with goblet cells and shows tall, numerous finger-like villi. Prominent plicae circulares are present, and the wall has inner circular and outer longitudinal muscle layers covered by serosa.	anatomy-viva-images/1783346103193_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	11	\N	6	2026-07-06 13:55:04.020502
62	Histology	Large intestine	\N	Abdomen	Large intestine is lined by simple columnar epithelium with abundant goblet cells. The mucosa lacks villi and shows numerous straight crypts of Lieberkuhn, typically without Paneth cells. Muscularis externa has taenia coli; submucosa contains vessels, Meissner's plexus, and muciphages.	anatomy-viva-images/1783346114858_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	13	\N	6	2026-07-06 13:55:15.848676
63	Histology	Vermiform Appendix	\N	Abdomen	Lined by simple columnar epithelium with a small narrow lumen; the mucosa lacks villi and has only poorly formed crypts. The submucosa is rich in lymphatic follicles extending into the lamina propria, and the muscularis externa has the usual inner circular and outer longitudinal layers without taenia coli.	anatomy-viva-images/1783346120456_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	14	\N	6	2026-07-06 13:55:21.293596
64	Histology	Liver	\N	Abdomen	Classical hepatic lobules have a central vein with plates of polygonal hepatocytes radiating outward. Portal triads lie at the lobular periphery/corners and sinusoids between hepatocyte plates contain Kupffer cells; the space of Disse is the perisinusoidal space between sinusoidal endothelium and hepatocytes.	anatomy-viva-images/1783346126808_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	15	\N	6	2026-07-06 13:55:27.764345
65	Histology	Gall Bladder	\N	Abdomen	Gallbladder mucosa is thrown into numerous branching folds, producing a characteristic honeycomb appearance. It is lined by simple tall columnar epithelium with microvilli and lacks goblet cells; the mucosa has only epithelium and lamina propria, lacking muscularis mucosae and mucosal glands. The wall includes an irregular fibromuscular coat of smooth muscle and connective tissue, and the lamina propria lacks lymphatics.	anatomy-viva-images/1783346138691_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	16	\N	6	2026-07-06 13:55:39.433335
66	Histology	Elastic Cartilage	\N	Generic	Elastic cartilage shows a distinct perichondrium, numerous chondrocytes in lacunae singly or in small groups, and a dense network of elastic fibers in the matrix. The matrix is relatively scant and this cartilage does not calcify easily with age.	anatomy-viva-images/1783346144965_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	17	\N	6	2026-07-06 13:55:45.856935
67	Histology	Pituitary Gland	\N	Head and Neck	Anterior pituitary (pars distalis) shows epithelial cells arranged in cords/clumps with chromophils—acidophils and basophils—and pale chromophobes. Pars intermedia is a narrow zone with colloid-filled follicles. Posterior pituitary (pars nervosa) lacks glandular cords, contains unmyelinated nerve fibers, and may show Herring bodies.	anatomy-viva-images/1783346151645_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	18	\N	6	2026-07-06 13:55:52.548456
68	Histology	Pancreas	\N	Abdomen	Pancreas shows exocrine serous acini with interlobular ducts lined by simple cuboidal epithelium and pale-staining islets of Langerhans embedded within the exocrine tissue. In islets, alpha cells are more peripheral and secrete glucagon, beta cells are more central and secrete insulin, and delta cells produce somatostatin.	anatomy-viva-images/1783346219210_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	19	\N	6	2026-07-06 13:57:00.13265
718	Bone	Left Elbow Joint, Lateral view	Left	Elbow	The X-ray displays the humeroulnar and humeroradial joints, with clear views of the olecranon process and radial head.	anatomy-viva-images/1783372513845_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	4	\N	6	2026-07-06 21:15:14.534766
789	Bone	Right Knee X-ray, AP view	Bilateral	Pelvis and Knee	The page includes labeled X-rays of the pelvis and knee joint, showing structures like the femur, patella, and iliac crest.	anatomy-viva-images/1783402580953_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	8	\N	6	2026-07-07 05:36:21.65971
846	Section Anatomy	Transverse section of the penis	\N	\N	\N	anatomy-viva-images/1783405061260_manual_manual.png	manual	1244	\N	6	2026-07-07 06:17:42.184055
847	Section Anatomy	Transverse section of a tubule of the testis of a rat	\N	\N	\N	anatomy-viva-images/1783405071222_manual_manual.png	manual	1240	\N	6	2026-07-07 06:17:52.174136
69	Histology	Kidney	\N	Abdomen	Kidney histology shows loop of Henle with thin segments lined by simple squamous epithelium and thicker ascending segments by simple cuboidal epithelium. Proximal convoluted tubules have simple cuboidal/low columnar cells with eosinophilic cytoplasm and a dense brush border, while distal convoluted tubules are simple cuboidal without a brush border and have a cleaner, wider lumen. Collecting ducts are lined by simple cuboidal to columnar epithelium, and podocytes form the visceral layer of Bowman's capsule.	anatomy-viva-images/1783346229905_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	21	\N	6	2026-07-06 13:57:11.68278
720	Bone	Nasal and Lacrimal Bones, Lateral view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372536461_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:37.1761
721	Bone	Nasal and Lacrimal Bones, Medial view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372537196_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:37.79387
72	Histology	Testis	\N	Pelvis	Testis is enclosed by tunica vaginalis, tunica albuginea, and tunica vasculosa. Fibrous septa divide it into lobules containing highly convoluted seminiferous tubules. Sertoli cells are tall supporting cells resting on the basement membrane, while Leydig cells are interstitial steroid-secreting cells between tubules.	anatomy-viva-images/1783346253820_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	25	\N	6	2026-07-06 13:57:34.825444
73	Histology	Epididymis	\N	Pelvis	Main duct is lined by pseudostratified columnar epithelium with tall principal cells and short basal cells. Principal cells bear long non-motile stereocilia, and basal cells act as stem cells. The surrounding smooth muscle thickens from head to tail, becoming more organized in the tail.	anatomy-viva-images/1783346260518_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	26	\N	6	2026-07-06 13:57:41.935196
74	Histology	Vas Deferens	\N	Pelvis	Vas deferens is lined by pseudostratified columnar epithelium over an elastic fiber-rich lamina propria. It is identified by a very narrow lumen with mucosal folds and an extremely thick smooth muscle wall arranged in three layers: inner longitudinal, middle circular, and outer longitudinal. The outer adventitia is fibroelastic connective tissue containing blood vessels and nerves.	anatomy-viva-images/1783346269046_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	27	\N	6	2026-07-06 13:57:49.871921
75	Histology	Prostate	\N	Pelvis	Prostate shows numerous compound tubuloalveolar glands embedded in a distinctive fibromuscular stroma. The secretory spaces are lined by simple columnar epithelium and often form branching mucosal folds. The glands are arranged concentrically around the urethra.	anatomy-viva-images/1783346274756_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	28	\N	6	2026-07-06 13:57:55.648742
76	Histology	Ovary	\N	Pelvis	Ovary is covered by epithelium and a thin tunica albuginea. It shows an outer cortex containing follicles and an inner vascular medulla of loose connective tissue. Identifying follicles include peripheral primordial follicles, zona pellucida in growing follicles, mature Graafian follicles with antrum/cumulus oophorus, and post-ovulatory corpus luteum.	anatomy-viva-images/1783346281403_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	29	\N	6	2026-07-06 13:58:02.386186
77	Histology	Fallopian Tube	\N	Pelvis	Highly branched longitudinal mucosal folds project into and nearly fill the lumen, especially in the ampulla. The lining is simple columnar epithelium with ciliated cells that move the ovum and non-ciliated secretory peg cells. The wall has smooth muscle arranged in inner circular and outer longitudinal layers.	anatomy-viva-images/1783346287703_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	30	\N	6	2026-07-06 13:58:08.631991
78	Histology	Uterus	\N	Pelvis	The uterine wall has three layers: endometrium, myometrium, and perimetrium. The endometrium is lined by simple columnar epithelium and contains vascular stroma with numerous tubular uterine glands extending toward the myometrium. The functional layer undergoes cyclic menstrual shedding, while the basal layer remains to regenerate the mucosa.	anatomy-viva-images/1783346303898_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	31	\N	6	2026-07-06 13:58:24.827758
79	Histology	Vagina	\N	Pelvis	Vaginal mucosa is lined by stratified squamous nonkeratinized epithelium over a loose connective tissue lamina propria rich in blood vessels, lymphatics, nerves, and elastic fibers. The muscle coat has a thicker outer longitudinal layer and a thinner inner circular layer; the lower end is surrounded by striated muscle forming an external sphincter, and the wall is mainly fibrous adventitia with serosa only over the posterior fornix.	anatomy-viva-images/1783346309663_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	32	\N	6	2026-07-06 13:58:30.432155
81	Histology	Spleen	\N	Abdomen	White pulp is basophilic lymphoid tissue forming the periarteriolar lymphatic sheath around a central arteriole; expansions with germinal centers are Malpighian bodies (splenic nodules). Red pulp consists of splenic cords of Billroth with reticular cells, macrophages, and blood cells, and human spleen shows predominantly open circulation from penicillar arterioles into the red pulp.	anatomy-viva-images/1783346322356_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	34	\N	6	2026-07-06 13:58:43.284655
848	Section Anatomy	Transverse section of scrotum and left testis	\N	\N	\N	anatomy-viva-images/1783405155235_manual_manual.png	manual	1235	\N	6	2026-07-07 06:19:16.130118
82	Histology	Thymus	\N	Thorax	Thymus shows lobular architecture with connective tissue septa extending from the capsule to form incompletely separated lobules. Each lobule has a darkly stained cortex rich in developing T-lymphocytes and a paler medulla, where characteristic Hassall's corpuscles are found. Thymic epithelial nurse cells help compartmentalize the cortex and eliminate self-reactive T cells.	anatomy-viva-images/1783346328956_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	35	\N	6	2026-07-06 13:58:49.743697
882	Section Anatomy	Horizontal disposition of the peritoneum in the lower abdomen	\N	\N	\N	anatomy-viva-images/1783406257997_manual_manual.png	manual	1150	\N	6	2026-07-07 06:37:38.824587
883	Section Anatomy	Vertical disposition of the peritoneum	\N	\N	\N	anatomy-viva-images/1783406284952_manual_manual.png	manual	1147	\N	6	2026-07-07 06:38:05.874787
722	Bone	Nasal and Lacrimal Bones, Inferior view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372537809_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:38.329281
86	Histology	Sublingual Gland	\N	Head and Neck	Sublingual gland is a compound mixed tubuloacinar salivary gland with predominance of pale-staining mucous acini. Intercalated ducts are short or poorly visible, intralobular ducts are nonstriated, and abundant interlobular connective tissue septa are present.	anatomy-viva-images/1783346352494_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	39	\N	6	2026-07-06 13:59:13.220092
87	Histology	Thin Skin	\N	Generic	Thin skin is lined by keratinized stratified squamous epithelium with a thin stratum corneum. It is identified by numerous hair follicles with associated sebaceous glands and visible arrector pili muscles in the dermis.	anatomy-viva-images/1783346358149_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	40	\N	6	2026-07-06 13:59:18.925036
88	Histology	Thick Skin	\N	Generic	Thick skin is lined by keratinized stratified squamous epithelium with an exceptionally thick stratum corneum. It shows a distinct stratum lucidum and prominent stratum granulosum, and the dermis contains abundant eccrine sweat glands.	anatomy-viva-images/1783346363339_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	41	\N	6	2026-07-06 13:59:24.173788
89	Histology	Spongy Bone	\N	Generic	Spongy bone lacks Haversian systems and is arranged as a trabecular network of bony rods or plates. The spaces between trabeculae are filled with bone marrow, and the trabeculae are lined by endosteum containing osteoblasts, osteoclasts, and osteoprogenitor cells.	anatomy-viva-images/1783346368734_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	42	\N	6	2026-07-06 13:59:29.480685
90	Histology	Compact Bone	\N	Generic	Compact bone shows osteons with concentric lamellae arranged around a central Haversian canal. Interstitial lamellae are remnants of older osteons, while lacunae contain osteocytes and are interconnected by canaliculi for metabolic exchange.	anatomy-viva-images/1783346381004_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	43	\N	6	2026-07-06 13:59:41.845893
723	Bone	Nasal and Lacrimal Bones, Lateral view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372538340_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:38.85232
92	Histology	Cerebrum	\N	Head and Neck	The cerebral cortex has outer gray matter containing neuronal cell bodies and an inner core of white matter. Pyramidal cells are triangular neurons with apices directed toward the cortical surface, while stellate (granule) neurons are small multipolar interneurons within the cortex; specialized interneurons include Martinotti and horizontal cells of Cajal.	anatomy-viva-images/1783346393453_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	45	\N	6	2026-07-06 13:59:54.334406
884	Section Anatomy	Front of nasal part of pharynx, as seen with the laryngoscope	\N	\N	\N	anatomy-viva-images/1783406292637_manual_manual.png	manual	1142	\N	6	2026-07-07 06:38:13.490743
94	Histology	Thyroid Gland	\N	Head and Neck	Thyroid parenchyma is composed of numerous follicles filled with colloid and lined by simple cuboidal follicular cells. Follicular cells, under TSH influence, synthesize and secrete T3 and T4, while parafollicular (C) cells lie between follicles without reaching the lumen and secrete calcitonin.	anatomy-viva-images/1783346405778_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	47	\N	6	2026-07-06 14:00:06.588751
95	Histology	Adrenal Gland	\N	Abdomen	The adrenal cortex shows three zones: outer zona glomerulosa with cells in rounded/U-shaped groups secreting mineralocorticoids, broad middle zona fasciculata with straight parallel cords separated by sinusoids, and inner zona reticularis with branching anastomosing cords secreting glucocorticoids and sex hormones. The medulla contains chromaffin cells, modified sympathetic postganglionic neurons.	anatomy-viva-images/1783346411952_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	48	\N	6	2026-07-06 14:00:12.895921
96	Histology	Spinal Cord	\N	Generic	\N	anatomy-viva-images/1783347511915_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	44	\N	6	2026-07-06 14:18:32.728272
103	Histology	Oesophagus	\N	Thorax	\N	anatomy-viva-images/1783347575802_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	6	\N	6	2026-07-06 14:19:36.687885
105	Histology	Lungs	\N	Thorax	\N	anatomy-viva-images/1783348730959_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	3	\N	6	2026-07-06 14:38:51.742719
106	Histology	Cerebellar Cortex	\N	Head and Neck	\N	anatomy-viva-images/1783348843715_manual_1783338496432_HistologySlides_New_Updated_Version.pdf.png	1783338496432_HistologySlides_New_Updated_Version.pdf	46	\N	6	2026-07-06 14:40:44.503273
885	Section Anatomy	Section through one of the crypts of the tonsil	\N	\N	\N	anatomy-viva-images/1783406299309_manual_manual.png	manual	1138	\N	6	2026-07-07 06:38:20.179905
886	Section Anatomy	Dissection, showing salivary glands of right side	\N	\N	\N	anatomy-viva-images/1783406306743_manual_manual.png	manual	1135	\N	6	2026-07-07 06:38:27.663777
887	Section Anatomy	Coronal section of tongue	\N	\N	\N	anatomy-viva-images/1783406319796_manual_manual.png	manual	1130	\N	6	2026-07-07 06:38:40.679423
888	Section Anatomy	Sagittal section through deciduous molar	\N	\N	\N	anatomy-viva-images/1783406328408_manual_manual.png	manual	1119	\N	6	2026-07-07 06:38:49.191785
889	Section Anatomy	Transverse section of a canine tooth root	\N	\N	\N	anatomy-viva-images/1783406335597_manual_manual.png	manual	1118	\N	6	2026-07-07 06:38:56.381041
890	Section Anatomy	Diagrams showing the arrangement and variations of the loops of the mesenteric vessels	\N	\N	\N	anatomy-viva-images/1783406337979_manual_manual.png	manual	1171	\N	6	2026-07-07 06:38:58.937161
891	Section Anatomy	Vertical section of a human aggregated lymphatic nodule	\N	\N	\N	anatomy-viva-images/1783406344840_manual_manual.png	manual	1170	\N	6	2026-07-07 06:39:05.790404
892	Section Anatomy	Vertical section of a tooth	\N	\N	\N	anatomy-viva-images/1783406362336_manual_manual.png	manual	1117	\N	6	2026-07-07 06:39:23.354375
127	Bone	Cranial Fossa, superior view	Median	Cranial	The cranial fossa is divided into anterior, middle, and posterior sections, each housing different parts of the brain. Key foramina include the optic canal and foramen magnum.	anatomy-viva-images/1783360260823_29_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	29	2026-07-11 11:32:52.848	68	2026-07-06 17:51:01.938913
130	Bone	Lateral view of Skull	Right	Cranial	Detailed lateral view highlighting the temporal bone, zygomatic arch, and external auditory meatus.	anatomy-viva-images/1783360298747_27_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	27	\N	68	2026-07-06 17:51:39.712564
131	Bone	Right Palatine & Maxillary Bones	Right	Skull	Shows right palatine and maxillary bones with detailed labels and main points.	anatomy-viva-images/1783360313034_35_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	35	\N	68	2026-07-06 17:51:54.104631
893	Section Anatomy	Reconstruction of a human embryo, sagittal section	\N	\N	\N	anatomy-viva-images/1783406398503_manual_manual.png	manual	1105	\N	6	2026-07-07 06:39:59.427759
894	Section Anatomy	Sagittal section of nose, mouth, pharynx, and larynx	\N	\N	\N	anatomy-viva-images/1783406407267_manual_manual.png	manual	1109	\N	6	2026-07-07 06:40:08.355347
137	Bone	Wrist Joint X-ray, lateral view	Right	Wrist	The image shows the scaphoid, lunate, and radius bones clearly labeled, which are key components of the wrist joint.	anatomy-viva-images/1783360432639_5_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	5	\N	68	2026-07-06 17:53:53.54344
138	Bone	Dorsoplantar view of the foot	Right	Foot	X-ray showing phalanges, metatarsals, and tarsal bones including cuneiforms, navicular, and cuboid.	anatomy-viva-images/1783360456404_9_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	9	\N	68	2026-07-06 17:54:17.522764
895	Section Anatomy	Abdominal part of digestive tube, sagittal section	\N	\N	\N	anatomy-viva-images/1783406415179_manual_manual.png	manual	1104	\N	6	2026-07-07 06:40:16.108831
140	Bone	Frontal View of Skull X-ray	Median	Skull	The X-ray shows the frontal view of the skull with clear visibility of the maxillary sinuses. The left maxillary sinus is highlighted, indicating sinusitis.	anatomy-viva-images/1783360503898_17_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	17	\N	68	2026-07-06 17:55:05.026302
141	Bone	Right Shoulder Joint, AP view	Right	Shoulder	The image highlights the acromioclavicular joint, glenoid cavity, and humeral head.	anatomy-viva-images/1783360522974_3_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	3	\N	68	2026-07-06 17:55:24.026012
142	Bone	Lumbo-Sacral Vertebrae, anterior view	Median	Lumbar and Sacral Spine	The image shows the lumbar vertebrae transitioning into the sacrum. Key features include the transverse processes and spinous processes.	anatomy-viva-images/1783360525816_13_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	13	\N	68	2026-07-06 17:55:26.784806
896	Section Anatomy	Transverse section of trachea	\N	\N	\N	anatomy-viva-images/1783406427211_manual_manual.png	manual	1087	\N	6	2026-07-07 06:40:28.049281
145	Bone	Lateral View of Skull X-ray	Left	Skull	The lateral view of the skull is shown with detailed labeling of the cranial bones and sutures. Key features include the parietal and occipital bones.	anatomy-viva-images/1783360563277_18_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	18	\N	68	2026-07-06 17:56:04.208865
146	Bone	A-P View of Skull X-ray	Median	Skull	The anterior-posterior view of the skull highlights the frontal and maxillary air sinuses. The sagittal suture and nasal septum are also visible.	anatomy-viva-images/1783360586221_19_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	19	\N	68	2026-07-06 17:56:27.298954
147	Bone	Cervical Spine, lateral view	Right	Cervical Spine	The lateral view of the cervical spine shows the vertebral bodies and intervertebral discs. The sphenoidal air sinus is marked.	anatomy-viva-images/1783360589176_15_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	15	\N	68	2026-07-06 17:56:30.134757
148	Bone	Lateral View of Cervical Spine X-ray	Left	Cervical Spine	The lateral view of the cervical spine shows vertebrae C1 to C7. Notable features include the spinous process of the axis and the vertebra prominence at C7.	anatomy-viva-images/1783360617502_20_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	20	\N	68	2026-07-06 17:56:58.541026
149	Bone	Cervical Spine, lateral view	Right	Cervical Spine	This image focuses on the cervical vertebrae with emphasis on the sphenoidal air sinus and temporomandibular joint.	anatomy-viva-images/1783360620828_16_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	16	\N	68	2026-07-06 17:57:01.801829
724	Bone	Nasal and Lacrimal Bones, Medial view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372538863_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:39.322443
725	Bone	Nasal and Lacrimal Bones, Superior view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372539331_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:39.782956
726	Bone	Nasal and Lacrimal Bones, Lateral view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372539794_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:40.310357
727	Bone	Nasal and Lacrimal Bones, Anterior view	Right	Facial	Includes vomer, inferior nasal concha, zygomatic, nasal, and lacrimal bones. Important for nasal structure and orbit formation.	anatomy-viva-images/1783372540321_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	38	\N	6	2026-07-06 21:15:40.837125
897	Section Anatomy	Transverse section of the trachea	\N	\N	\N	anatomy-viva-images/1783406434551_manual_manual.png	manual	1086	\N	6	2026-07-07 06:40:35.382826
728	Bone	Right Temporal Bone, Lateral view	Right	Cranial	Includes squamous, petrous, and tympanic parts. Key features are the zygomatic process, mastoid process, and styloid process.	anatomy-viva-images/1783372559350_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	37	\N	6	2026-07-06 21:16:00.156776
729	Bone	Right Temporal Bone, Medial view	Right	Cranial	Includes squamous, petrous, and tympanic parts. Key features are the zygomatic process, mastoid process, and styloid process.	anatomy-viva-images/1783372560181_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	37	\N	6	2026-07-06 21:16:00.871035
730	Bone	Right Temporal Bone, Inferior view	Right	Cranial	Includes squamous, petrous, and tympanic parts. Key features are the zygomatic process, mastoid process, and styloid process.	anatomy-viva-images/1783372560892_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	37	\N	6	2026-07-06 21:16:01.603368
898	Section Anatomy	Laryngoscopic view of interior of larynx	\N	\N	\N	anatomy-viva-images/1783406468279_manual_manual.png	manual	1081	\N	6	2026-07-07 06:41:09.124441
731	Bone	Right Temporal Bone, Superior view	Right	Cranial	Includes squamous, petrous, and tympanic parts. Key features are the zygomatic process, mastoid process, and styloid process.	anatomy-viva-images/1783372561617_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	37	\N	6	2026-07-06 21:16:02.220174
732	Bone	Right Temporal Bone, Anterior view	Right	Cranial	Includes squamous, petrous, and tympanic parts. Key features are the zygomatic process, mastoid process, and styloid process.	anatomy-viva-images/1783372562236_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	37	\N	6	2026-07-06 21:16:02.821357
733	Bone	Mandible, Left lateral view	Bilateral	Facial	The mandible is the only movable bone of the face, articulating with the skull at the temporomandibular joint. It consists of the body and ramus, with key features like the mental foramen and coronoid process.	anatomy-viva-images/1783372581232_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	32	\N	6	2026-07-06 21:16:22.028811
734	Bone	Mandible, Medial view	Bilateral	Facial	The mandible is the only movable bone of the face, articulating with the skull at the temporomandibular joint. It consists of the body and ramus, with key features like the mental foramen and coronoid process.	anatomy-viva-images/1783372582074_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	32	\N	6	2026-07-06 21:16:22.675365
735	Bone	Mandible, Right lateral view	Bilateral	Facial	The mandible is the only movable bone of the face, articulating with the skull at the temporomandibular joint. It consists of the body and ramus, with key features like the mental foramen and coronoid process.	anatomy-viva-images/1783372582689_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	32	\N	6	2026-07-06 21:16:23.359074
736	Bone	Mandible, Anterior view	Bilateral	Facial	The mandible is the only movable bone of the face, articulating with the skull at the temporomandibular joint. It consists of the body and ramus, with key features like the mental foramen and coronoid process.	anatomy-viva-images/1783372583375_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	32	\N	6	2026-07-06 21:16:24.058931
737	Bone	Mandible, Lateral view	Bilateral	Facial	The mandible is the only movable bone of the face, articulating with the skull at the temporomandibular joint. It consists of the body and ramus, with key features like the mental foramen and coronoid process.	anatomy-viva-images/1783372584085_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	32	\N	6	2026-07-06 21:16:24.713295
738	Bone	Skull, Anterior view	Bilateral	Cranial	Illustrations of the skull from frontal, lateral, and posterior views showing key features like the frontal eminence, coronal suture, and foramen magnum.	anatomy-viva-images/1783372602230_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	25	\N	6	2026-07-06 21:16:43.086435
739	Bone	Skull, Left lateral view	Bilateral	Cranial	Illustrations of the skull from frontal, lateral, and posterior views showing key features like the frontal eminence, coronal suture, and foramen magnum.	anatomy-viva-images/1783372603107_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	25	\N	6	2026-07-06 21:16:43.813728
740	Bone	Skull, Posterior view	Bilateral	Cranial	Illustrations of the skull from frontal, lateral, and posterior views showing key features like the frontal eminence, coronal suture, and foramen magnum.	anatomy-viva-images/1783372603829_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	25	\N	6	2026-07-06 21:16:44.521873
790	Bone	Right Knee X-ray, Lateral view	Bilateral	Pelvis and Knee	The page includes labeled X-rays of the pelvis and knee joint, showing structures like the femur, patella, and iliac crest.	anatomy-viva-images/1783402581678_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	8	\N	6	2026-07-07 05:36:22.359955
791	Bone	Elbow Joint	Bilateral	Upper Limb	Includes radioulnar, elbow, shoulder, sternoclavicular, and acromioclavicular joints. Key features and ligaments are labeled for each joint.	anatomy-viva-images/1783402597543_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	7	\N	6	2026-07-07 05:36:38.359474
792	Bone	Knee Joint	Bilateral	Upper Limb	Includes radioulnar, elbow, shoulder, sternoclavicular, and acromioclavicular joints. Key features and ligaments are labeled for each joint.	anatomy-viva-images/1783402598377_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	7	\N	6	2026-07-07 05:36:39.104717
793	Bone	Shoulder and Elbow Joints	Bilateral	Upper Limb	Includes radioulnar, elbow, shoulder, sternoclavicular, and acromioclavicular joints. Key features and ligaments are labeled for each joint.	anatomy-viva-images/1783402599128_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	7	\N	6	2026-07-07 05:36:39.873129
794	Bone	Shoulder Joint	Bilateral	Upper Limb	Includes radioulnar, elbow, shoulder, sternoclavicular, and acromioclavicular joints. Key features and ligaments are labeled for each joint.	anatomy-viva-images/1783402599885_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	7	\N	6	2026-07-07 05:36:40.601156
849	Section Anatomy	Median sagittal section of female pelvis	\N	\N	\N	anatomy-viva-images/1783405162893_manual_manual.png	manual	1227	\N	6	2026-07-07 06:19:23.836004
899	Section Anatomy	Sagittal section of the larynx and upper part of the trachea	\N	\N	\N	anatomy-viva-images/1783406498443_manual_manual.png	manual	1079	\N	6	2026-07-07 06:41:39.329999
851	Section Anatomy	Male pelvic organs seen from right side	\N	\N	\N	anatomy-viva-images/1783405179882_manual_manual.png	manual	1225	\N	6	2026-07-07 06:19:40.61876
852	Section Anatomy	Median sagittal section of male pelvis	\N	\N	\N	anatomy-viva-images/1783405188304_manual_manual.png	manual	1224	\N	6	2026-07-07 06:19:49.316032
900	Section Anatomy	Section through the spiral organ of Corti	\N	\N	\N	anatomy-viva-images/1783406525087_manual_manual.png	manual	1056	\N	6	2026-07-07 06:42:06.150516
901	Section Anatomy	Diagrammatic longitudinal section of the cochlea	\N	\N	\N	anatomy-viva-images/1783406534421_manual_manual.png	manual	1055	\N	6	2026-07-07 06:42:15.441612
902	Section Anatomy	Transverse section of a human semicircular canal and duct	\N	\N	\N	anatomy-viva-images/1783406542367_manual_manual.png	manual	1054	\N	6	2026-07-07 06:42:23.328118
903	Section Anatomy	Cochlea and vestibule, superior view	\N	\N	\N	anatomy-viva-images/1783406550472_manual_manual.png	manual	1050	\N	6	2026-07-07 06:42:31.506723
904	Section Anatomy	Specimen from a child, sagittal section	\N	\N	\N	anatomy-viva-images/1783406559206_manual_manual.png	manual	999	\N	6	2026-07-07 06:42:40.166738
905	Section Anatomy	Lateral wall of nasal cavity	\N	\N	\N	anatomy-viva-images/1783406593241_manual_manual.png	manual	995	\N	6	2026-07-07 06:43:14.230146
906	Section Anatomy	Coronal section of nasal cavities	\N	\N	\N	anatomy-viva-images/1783406602028_manual_manual.png	manual	998	\N	6	2026-07-07 06:43:23.095441
741	Bone	Sacrum, Anterior view	Median	Pelvis	Illustration of the sacrum showing its articulation with L5 and the pelvic inlet and outlet diameters, emphasizing the sacral promontory and foramina.	anatomy-viva-images/1783372651393_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	20	\N	6	2026-07-06 21:17:32.19635
742	Bone	Sacrum, Superior view	Median	Pelvis	Illustration of the sacrum showing its articulation with L5 and the pelvic inlet and outlet diameters, emphasizing the sacral promontory and foramina.	anatomy-viva-images/1783372652244_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	20	\N	6	2026-07-06 21:17:32.834255
743	Bone	Sacrum, Inferior view	Median	Pelvis	Illustration of the sacrum showing its articulation with L5 and the pelvic inlet and outlet diameters, emphasizing the sacral promontory and foramina.	anatomy-viva-images/1783372652856_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	20	\N	6	2026-07-06 21:17:33.438187
788	Bone	Pelvis X-ray, AP view	Bilateral	Pelvis and Knee	The page includes labeled X-rays of the pelvis and knee joint, showing structures like the femur, patella, and iliac crest.	anatomy-viva-images/1783402579886_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	8	\N	6	2026-07-07 05:36:20.930312
907	Section Anatomy	Section of the olfactory mucous membrane	\N	\N	\N	anatomy-viva-images/1783406633985_manual_manual.png	manual	997	\N	6	2026-07-07 06:43:54.787222
855	Section Anatomy	Vertical section of kidney	\N	\N	\N	anatomy-viva-images/1783405423636_manual_manual.png	manual	1217	\N	6	2026-07-07 06:23:44.510374
856	Section Anatomy	Transverse section of ureter	\N	\N	\N	anatomy-viva-images/1783405433150_manual_manual.png	manual	1222	\N	6	2026-07-07 06:23:54.102788
858	Section Anatomy	Median sagittal section through the hypophysis	\N	\N	\N	anatomy-viva-images/1783405470655_manual_manual.png	manual	1271	\N	6	2026-07-07 06:24:31.654765
859	Section Anatomy	Transverse section of kidney capsule	\N	\N	\N	anatomy-viva-images/1783405543727_manual_manual.png	manual	1216	\N	6	2026-07-07 06:25:44.619758
860	Section Anatomy	Section of cortex of human kidney	\N	\N	\N	anatomy-viva-images/1783405552541_manual_manual.png	manual	1220	\N	6	2026-07-07 06:25:53.515573
861	Section Anatomy	Section of the ovary of a newly born child	\N	\N	\N	anatomy-viva-images/1783405559361_manual_manual.png	manual	1206	\N	6	2026-07-07 06:26:00.087445
862	Section Anatomy	Transverse section of human embryo	\N	\N	\N	anatomy-viva-images/1783405653342_manual_manual.png	manual	1205	\N	6	2026-07-07 06:27:34.143689
863	Section Anatomy	Section of pancreas of dog	\N	\N	\N	anatomy-viva-images/1783405665858_manual_manual.png	manual	1200	\N	6	2026-07-07 06:27:46.7841
864	Section Anatomy	Cross-section of human embryo	\N	\N	\N	anatomy-viva-images/1783405673160_manual_manual.png	manual	1199	\N	6	2026-07-07 06:27:53.966065
908	Section Anatomy	Vertical section of papilla foliata	\N	\N	\N	anatomy-viva-images/1783406642771_manual_manual.png	manual	991	\N	6	2026-07-07 06:44:03.827136
909	Section Anatomy	Transverse section of mid-brain at level of inferior colliculi	\N	\N	\N	anatomy-viva-images/1783406656456_manual_manual.png	manual	801	\N	6	2026-07-07 06:44:17.479419
910	Section Anatomy	Transverse section through the mid-brain	\N	\N	\N	anatomy-viva-images/1783406662737_manual_manual.png	manual	805	\N	6	2026-07-07 06:44:23.455841
911	Section Anatomy	Scheme of roof of fourth ventricle	\N	\N	\N	anatomy-viva-images/1783406671225_manual_manual.png	manual	798	\N	6	2026-07-07 06:44:32.196976
912	Section Anatomy	Coronal section through mid-brain	\N	\N	\N	anatomy-viva-images/1783406680719_manual_manual.png	manual	800	\N	6	2026-07-07 06:44:41.713372
1009	Visceral	Heart	\N	\N	\N	anatomy-viva-images/1783425573221_manual_Wikimedia_Commons__CC-BY-SA_.png	Wikimedia Commons (CC-BY-SA)	\N	\N	6	2026-07-07 11:59:34.939183
1010	Visceral	Heart	\N	\N	\N	anatomy-viva-images/1783425575537_manual_Wikimedia_Commons__CC-BY-SA_.png	Wikimedia Commons (CC-BY-SA)	\N	\N	6	2026-07-07 11:59:36.635204
1011	Visceral	Liver	\N	\N	\N	anatomy-viva-images/1783425577214_manual_Wikimedia_Commons__CC-BY-SA_.png	Wikimedia Commons (CC-BY-SA)	\N	\N	6	2026-07-07 11:59:38.190061
744	Bone	Typical Lumbar Vertebra, Right lateral view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372673142_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:53.949126
745	Bone	Typical Lumbar Vertebra, Left lateral view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372673963_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:54.460165
746	Bone	Typical Lumbar Vertebra, Superior view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372674472_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:55.057997
747	Bone	Typical Lumbar Vertebra, Superior view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372675070_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:55.672386
748	Bone	Typical Lumbar Vertebra, Right lateral view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372675680_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:56.185997
749	Bone	Typical Lumbar Vertebra, Left lateral view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372676195_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:56.691973
750	Bone	Typical Lumbar Vertebra, Oblique view	Median	Lumbar Spine	Illustration highlights the lumbar vertebrae with key features such as the large kidney-shaped body, triangular vertebral foramen, and long slender spine.	anatomy-viva-images/1783372676700_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	19	\N	6	2026-07-06 21:17:57.146295
54	Histology	Tongue (Filiform & Fungiform Papillae)	\N	Head and Neck	Filiform papillae are numerous small conical projections lined by stratified squamous epithelium and are heavily keratinized at the tips. Fungiform papillae are covered by non-keratinized stratified squamous epithelium and may show a few pale-staining taste buds. Beneath the lamina propria is a core of interlacing skeletal muscle fibers arranged in three perpendicular planes.	anatomy-viva-images/1783346064256_manual_HistologySlides__New_Udated_Version___1783345012349.pdf.png	HistologySlides_(New_Udated_Version*)_1783345012349.pdf	5	2026-07-07 05:39:14.988	6	2026-07-06 13:54:24.987234
865	Section Anatomy	Section of the urogenital fold of a chick embryo	\N	\N	\N	anatomy-viva-images/1783405891426_manual_manual.png	manual	1201	\N	6	2026-07-07 06:31:32.43669
866	Section Anatomy	Section of injected liver (dog)	\N	\N	\N	anatomy-viva-images/1783405898318_manual_manual.png	manual	1191	\N	6	2026-07-07 06:31:39.193691
867	Section Anatomy	Transverse section of gall-bladder	\N	\N	\N	anatomy-viva-images/1783405905845_manual_manual.png	manual	1194	\N	6	2026-07-07 06:31:46.753557
868	Section Anatomy	Longitudinal section of a hepatic vein	\N	\N	\N	anatomy-viva-images/1783405911625_manual_manual.png	manual	1190	\N	6	2026-07-07 06:31:52.200812
913	Section Anatomy	Transverse section of the medulla oblongata	\N	\N	\N	anatomy-viva-images/1783406739858_manual_manual.png	manual	784	\N	6	2026-07-07 06:45:40.438459
914	Section Anatomy	Transverse section of medulla oblongata	\N	\N	\N	anatomy-viva-images/1783406747987_manual_manual.png	manual	780	\N	6	2026-07-07 06:45:48.926125
915	Section Anatomy	Transverse sections of the medulla spinalis	\N	\N	\N	anatomy-viva-images/1783406756693_manual_manual.png	manual	757	\N	6	2026-07-07 06:45:57.682496
916	Section Anatomy	Transverse sections of the medulla spinalis	\N	\N	\N	anatomy-viva-images/1783406769566_manual_manual.png	manual	754	\N	6	2026-07-07 06:46:10.595782
1012	Visceral	Uterus	\N	\N	\N	anatomy-viva-images/1783425578731_manual_Wikimedia_Commons__CC-BY-SA_.png	Wikimedia Commons (CC-BY-SA)	\N	\N	6	2026-07-07 11:59:39.463284
751	Bone	Right Hip Bone, Medial view	Right	Pelvic	Illustrations of the hip bone showing the iliac crest, acetabulum, and ischial tuberosity. Important landmarks include the ASIS and greater sciatic notch.	anatomy-viva-images/1783372703885_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	12	\N	6	2026-07-06 21:18:24.781583
752	Bone	Right Hip Bone, Lateral view	Right	Pelvic	Illustrations of the hip bone showing the iliac crest, acetabulum, and ischial tuberosity. Important landmarks include the ASIS and greater sciatic notch.	anatomy-viva-images/1783372704805_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	12	\N	6	2026-07-06 21:18:25.690109
1013	Visceral	Lung	\N	\N	\N	anatomy-viva-images/1783425604332_manual_Wikimedia_Commons__CC_.png	Wikimedia Commons (CC)	\N	\N	6	2026-07-07 12:00:05.060911
795	Bone	Wrist Joint, AP view	Bilateral	Wrist	The X-ray shows the distal radius and ulna, with clear visibility of the carpal bones and metacarpals.	anatomy-viva-images/1783403076230_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	2	\N	6	2026-07-07 05:44:37.178373
796	Bone	Wrist Joint, Oblique view	Bilateral	Wrist	The X-ray shows the distal radius and ulna, with clear visibility of the carpal bones and metacarpals.	anatomy-viva-images/1783403077235_manual_Radiology__1783358909020.pdf.png	Radiology__1783358909020.pdf	2	\N	6	2026-07-07 05:44:38.020973
797	Bone	Sphenoid Bone, Superior view	Median	Skull	Illustrates sphenoid and ethmoid bones with key points and labeled features.	anatomy-viva-images/1783403089908_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	36	\N	6	2026-07-07 05:44:50.68608
798	Bone	Sphenoid Bone, Inferior view	Median	Skull	Illustrates sphenoid and ethmoid bones with key points and labeled features.	anatomy-viva-images/1783403090716_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	36	\N	6	2026-07-07 05:44:51.397247
799	Bone	Sphenoid Bone, Anterior view	Median	Skull	Illustrates sphenoid and ethmoid bones with key points and labeled features.	anatomy-viva-images/1783403091415_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	36	\N	6	2026-07-07 05:44:52.085084
800	Bone	Ethmoid Bone, Right lateral view	Median	Skull	Illustrates sphenoid and ethmoid bones with key points and labeled features.	anatomy-viva-images/1783403092101_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	36	\N	6	2026-07-07 05:44:52.72811
917	Section Anatomy	Sagittal section of vertebral canal	\N	\N	\N	anatomy-viva-images/1783406778345_manual_manual.png	manual	750	\N	6	2026-07-07 06:46:19.129348
918	Section Anatomy	Transverse section of medulla oblongata	\N	\N	\N	anatomy-viva-images/1783406785875_manual_manual.png	manual	749	\N	6	2026-07-07 06:46:26.738204
919	Section Anatomy	Heart opened on right side	\N	\N	\N	anatomy-viva-images/1783406794233_manual_manual.png	manual	512	\N	6	2026-07-07 06:46:35.165871
920	Section Anatomy	Transverse sections of the aortic bulb	\N	\N	\N	anatomy-viva-images/1783406804998_manual_manual.png	manual	513	\N	6	2026-07-07 06:46:45.844516
921	Section Anatomy	Transverse sections of the aortic bulb	\N	\N	\N	anatomy-viva-images/1783406805096_manual_manual.png	manual	513	\N	6	2026-07-07 06:46:45.945499
922	Section Anatomy	Dorsal surface of heart of human embryo	\N	\N	\N	anatomy-viva-images/1783406813627_manual_manual.png	manual	510	\N	6	2026-07-07 06:46:54.646753
923	Section Anatomy	Dorsal surface of heart of human embryo	\N	\N	\N	anatomy-viva-images/1783406813755_manual_manual.png	manual	510	\N	6	2026-07-07 06:46:54.791361
924	Section Anatomy	Section of a medium-sized artery	\N	\N	\N	anatomy-viva-images/1783406824678_manual_manual.png	manual	500	\N	6	2026-07-07 06:47:05.497237
925	Section Anatomy	Section of a medium-sized vein	\N	\N	\N	anatomy-viva-images/1783406833859_manual_manual.png	manual	502	\N	6	2026-07-07 06:47:14.959601
926	Section Anatomy	Transverse section of a small artery and vein	\N	\N	\N	anatomy-viva-images/1783406841372_manual_manual.png	manual	498	\N	6	2026-07-07 06:47:22.224764
1014	Visceral	Stomach	\N	\N	\N	anatomy-viva-images/1783425605448_manual_Wikimedia_Commons__CC_.png	Wikimedia Commons (CC)	\N	\N	6	2026-07-07 12:00:06.538164
1015	Visceral	Gallbladder	\N	\N	\N	anatomy-viva-images/1783425606872_manual_Wikimedia_Commons__CC_.png	Wikimedia Commons (CC)	\N	\N	6	2026-07-07 12:00:07.695865
754	Bone	Articulated Foot, Superior view	Bilateral	Foot	Illustration shows the bones of the foot including the tarsals, metatarsals, and phalanges, with emphasis on the talus and calcaneus forming the ankle complex.	anatomy-viva-images/1783372729611_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	17	\N	6	2026-07-06 21:18:50.21618
755	Bone	Articulated Foot, Superior view	Bilateral	Foot	Illustration shows the bones of the foot including the tarsals, metatarsals, and phalanges, with emphasis on the talus and calcaneus forming the ankle complex.	anatomy-viva-images/1783372730240_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	17	\N	6	2026-07-06 21:18:50.961114
756	Bone	Articulated Foot, Superior view	Bilateral	Foot	Illustration shows the bones of the foot including the tarsals, metatarsals, and phalanges, with emphasis on the talus and calcaneus forming the ankle complex.	anatomy-viva-images/1783372730973_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	17	\N	6	2026-07-06 21:18:51.532708
757	Bone	Tibia, Anterior view	Bilateral	Leg	The tibia is a weight-bearing bone with medial and lateral condyles at the upper end and a medial malleolus at the lower end.	anatomy-viva-images/1783372767196_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	15	\N	6	2026-07-06 21:19:28.016158
759	Bone	Tibia, Superior view	Bilateral	Leg	The tibia is a weight-bearing bone with medial and lateral condyles at the upper end and a medial malleolus at the lower end.	anatomy-viva-images/1783372768539_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	15	\N	6	2026-07-06 21:19:29.054419
760	Bone	Thoracic Vertebrae, Superior view	Median	Thoracic	Illustrations of typical and atypical thoracic vertebrae. Key features include the heart-shaped body and costal facets for rib articulation.	anatomy-viva-images/1783372784517_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	11	\N	6	2026-07-06 21:19:45.180773
761	Bone	Thoracic Vertebrae, Lateral view	Median	Thoracic	Illustrations of typical and atypical thoracic vertebrae. Key features include the heart-shaped body and costal facets for rib articulation.	anatomy-viva-images/1783372785206_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	11	\N	6	2026-07-06 21:19:45.881348
927	Section Anatomy	Median sagittal section through the occipital bone and first three cervical vertebrae	\N	\N	\N	anatomy-viva-images/1783406954924_manual_manual.png	manual	294	\N	6	2026-07-07 06:49:15.829773
802	Bone	Frontal Bone, External view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403120076_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:20.757714
803	Bone	Frontal Bone, Internal view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403120768_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:21.390322
804	Bone	Parietal Bone, Internal surface view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403121399_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:22.006347
805	Bone	Parietal Bone, External surface view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403122017_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:22.628912
806	Bone	Occipital Bone, Superior view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403122641_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:23.338144
807	Bone	Occipital Bone, Inferior internal view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403123351_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:24.010033
808	Bone	Atlas (C1), Posterior view	Median	Cervical	Atlas (C1) is ring-shaped with no body, and Axis (C2) has a prominent dens for rotation.	anatomy-viva-images/1783403138410_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	24	\N	6	2026-07-07 05:45:39.2255
809	Bone	Atlas (C1), Superior view	Median	Cervical	Atlas (C1) is ring-shaped with no body, and Axis (C2) has a prominent dens for rotation.	anatomy-viva-images/1783403139292_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	24	\N	6	2026-07-07 05:45:39.887052
810	Bone	Atlas (C1), Inferior view	Median	Cervical	Atlas (C1) is ring-shaped with no body, and Axis (C2) has a prominent dens for rotation.	anatomy-viva-images/1783403139905_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	24	\N	6	2026-07-07 05:45:40.41658
811	Bone	Axis (C2), Superior view	Median	Cervical	Atlas (C1) is ring-shaped with no body, and Axis (C2) has a prominent dens for rotation.	anatomy-viva-images/1783403140426_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	24	\N	6	2026-07-07 05:45:41.074282
812	Bone	Axis (C2), Posterior view	Median	Cervical	Atlas (C1) is ring-shaped with no body, and Axis (C2) has a prominent dens for rotation.	anatomy-viva-images/1783403141100_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	24	\N	6	2026-07-07 05:45:41.645547
813	Bone	Typical Cervical Vertebra, Lateral view (1)	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403158768_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:45:59.663538
928	Histology	Kidney	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420677792_manual_web-histology-kidney.jpg.png	web-histology-kidney.jpg	\N	\N	6	2026-07-07 10:37:58.57971
929	Histology	Testis	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420682660_manual_web-histology-testis.jpg.png	web-histology-testis.jpg	\N	\N	6	2026-07-07 10:38:03.276275
930	Histology	Ovary	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420686330_manual_web-histology-ovary.jpg.png	web-histology-ovary.jpg	\N	\N	6	2026-07-07 10:38:07.144703
931	Histology	Thyroid Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420689867_manual_web-histology-thyroid_gland.jpg.png	web-histology-thyroid_gland.jpg	\N	\N	6	2026-07-07 10:38:10.423223
762	Bone	Sternum, Anterior view	Median	Thorax	The sternum is shown with its parts: manubrium, body, and xiphoid process. Articulations with clavicles and costal cartilages are detailed.	anatomy-viva-images/1783372821529_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	8	\N	6	2026-07-06 21:20:22.452598
763	Bone	Sternum, Right lateral view	Median	Thorax	The sternum is shown with its parts: manubrium, body, and xiphoid process. Articulations with clavicles and costal cartilages are detailed.	anatomy-viva-images/1783372822469_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	8	\N	6	2026-07-06 21:20:23.111875
764	Bone	Sternum, Anterior view with costal cartilages	Median	Thorax	The sternum is shown with its parts: manubrium, body, and xiphoid process. Articulations with clavicles and costal cartilages are detailed.	anatomy-viva-images/1783372823128_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	8	\N	6	2026-07-06 21:20:23.815687
49	Prosection	Anterior Triangle of Neck - Carotid Sheath and Scalene Muscles	Right	Neck	AI-cleaned web-sourced image (labels removed)	anatomy-viva-images/1783316130038_upper_limb_3_slide10b_edited.png	web-sourced-cleaned-neck-triangle.png	\N	2026-07-07 07:03:45.982	\N	2026-07-06 05:35:48.644264
765	Bone	Sternum, Posterior view	Median	Thorax	The sternum is shown with its parts: manubrium, body, and xiphoid process. Articulations with clavicles and costal cartilages are detailed.	anatomy-viva-images/1783372823831_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	8	\N	6	2026-07-06 21:20:24.42217
823	Bone	Typical Rib, Posterior view	Bilateral	Thoracic	Illustration of a typical rib showing the head, neck, tubercle, and shaft. Key features include the costal groove and articular facets.	anatomy-viva-images/1783403232761_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	9	\N	6	2026-07-07 05:47:13.731346
824	Bone	Typical Rib, Anterior end view	Bilateral	Thoracic	Illustration of a typical rib showing the head, neck, tubercle, and shaft. Key features include the costal groove and articular facets.	anatomy-viva-images/1783403233746_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	9	\N	6	2026-07-07 05:47:14.397743
825	Bone	Typical Rib, Inferior view	Bilateral	Thoracic	Illustration of a typical rib showing the head, neck, tubercle, and shaft. Key features include the costal groove and articular facets.	anatomy-viva-images/1783403234410_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	9	\N	6	2026-07-07 05:47:15.142275
814	Bone	Typical Cervical Vertebra, Lateral view (2)	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403197307_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:46:38.20438
815	Bone	Typical Cervical Vertebra, Superior view (1)	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403198226_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:46:38.920373
816	Bone	Typical Cervical Vertebra, Inferior view	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403198941_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:46:39.668479
817	Bone	Typical Cervical Vertebra, Superior view (2)	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403199681_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:46:40.353038
818	Bone	Typical Cervical Vertebra, Posterior view	Right	Cervical	Features include bifid spinous process, transverse foramina, and small body with uncinate processes.	anatomy-viva-images/1783403200364_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	23	\N	6	2026-07-07 05:46:40.982873
820	Bone	2nd (Atypical) Rib, Superior view	Bilateral	Thoracic	Illustrations of the 1st, 2nd, and floating ribs. Notable features include grooves for subclavian vessels and muscle attachments.	anatomy-viva-images/1783403216710_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	10	\N	6	2026-07-07 05:46:57.481072
821	Bone	10th (Atypical) Rib, Superior view	Bilateral	Thoracic	Illustrations of the 1st, 2nd, and floating ribs. Notable features include grooves for subclavian vessels and muscle attachments.	anatomy-viva-images/1783403217502_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	10	\N	6	2026-07-07 05:46:58.187486
822	Bone	11th/12th (Floating) Rib, Superior view	Bilateral	Thoracic	Illustrations of the 1st, 2nd, and floating ribs. Notable features include grooves for subclavian vessels and muscle attachments.	anatomy-viva-images/1783403218200_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	10	\N	6	2026-07-07 05:46:58.897543
932	Histology	Adrenal Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420694860_manual_web-histology-adrenal_gland.jpg.png	web-histology-adrenal_gland.jpg	\N	\N	6	2026-07-07 10:38:15.559059
933	Histology	Spleen	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420702283_manual_web-histology-spleen.jpg.png	web-histology-spleen.jpg	\N	\N	6	2026-07-07 10:38:22.810986
934	Histology	Thymus	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420709884_manual_web-histology-thymus.jpg.png	web-histology-thymus.jpg	\N	\N	6	2026-07-07 10:38:30.805432
766	Bone	Femur, Anterior view	Bilateral	Thigh	The femur is the longest bone in the body, with a spherical head proximally and condyles distally. It articulates with the hip bone and tibia.	anatomy-viva-images/1783372846595_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	14	\N	6	2026-07-06 21:20:47.409772
767	Bone	Femur, Posterior view	Bilateral	Thigh	The femur is the longest bone in the body, with a spherical head proximally and condyles distally. It articulates with the hip bone and tibia.	anatomy-viva-images/1783372847436_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	14	\N	6	2026-07-06 21:20:48.162324
768	Bone	Femur, Anterior view with muscle attachments	Bilateral	Thigh	The femur is the longest bone in the body, with a spherical head proximally and condyles distally. It articulates with the hip bone and tibia.	anatomy-viva-images/1783372848175_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	14	\N	6	2026-07-06 21:20:48.77338
769	Bone	Femur, Posterior view with muscle attachments	Bilateral	Thigh	The femur is the longest bone in the body, with a spherical head proximally and condyles distally. It articulates with the hip bone and tibia.	anatomy-viva-images/1783372848787_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	14	\N	6	2026-07-06 21:20:49.436419
801	Bone	Frontal Bone, Anterior view	Bilateral	Skull	Includes frontal, parietal, and occipital bones with labeled features and main points.	anatomy-viva-images/1783403119335_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	34	\N	6	2026-07-07 05:45:20.057208
935	Histology	Submandibular Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420734268_manual_web-histology-submandibular_gland.jpg.png	web-histology-submandibular_gland.jpg	\N	\N	6	2026-07-07 10:38:55.003118
936	Histology	Sublingual Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420737510_manual_web-histology-sublingual_gland.jpg.png	web-histology-sublingual_gland.jpg	\N	\N	6	2026-07-07 10:38:58.085536
937	Histology	Lungs	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420741148_manual_web-histology-lungs.jpg.png	web-histology-lungs.jpg	\N	\N	6	2026-07-07 10:39:01.94021
938	Histology	Trachea	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420745060_manual_web-histology-trachea.jpg.png	web-histology-trachea.jpg	\N	\N	6	2026-07-07 10:39:05.965268
939	Histology	Oesophagus	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420748633_manual_web-histology-oesophagus.jpg.png	web-histology-oesophagus.jpg	\N	\N	6	2026-07-07 10:39:09.426252
940	Histology	Fundus of Stomach	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420753972_manual_web-histology-fundus_of_stomach.jpg.png	web-histology-fundus_of_stomach.jpg	\N	\N	6	2026-07-07 10:39:14.697235
941	Histology	Pylorus of Stomach	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420758566_manual_web-histology-pylorus_of_stomach.png.png	web-histology-pylorus_of_stomach.png	\N	\N	6	2026-07-07 10:39:19.38804
942	Histology	Duodenum	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420768248_manual_web-histology-duodenum.jpg.png	web-histology-duodenum.jpg	\N	\N	6	2026-07-07 10:39:28.870488
943	Histology	Jejunum	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420784499_manual_web-histology-jejunum.jpg.png	web-histology-jejunum.jpg	\N	\N	6	2026-07-07 10:39:45.441997
944	Histology	Ileum	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420788185_manual_web-histology-ileum.jpg.png	web-histology-ileum.jpg	\N	\N	6	2026-07-07 10:39:48.997366
945	Histology	Large intestine	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420792178_manual_web-histology-large_intestine.png.png	web-histology-large_intestine.png	\N	\N	6	2026-07-07 10:39:53.033523
946	Histology	Vermiform Appendix	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420795687_manual_web-histology-vermiform_appendix.jpg.png	web-histology-vermiform_appendix.jpg	\N	\N	6	2026-07-07 10:39:56.477732
947	Histology	Gall Bladder	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420799218_manual_web-histology-gall_bladder.jpg.png	web-histology-gall_bladder.jpg	\N	\N	6	2026-07-07 10:40:00.049297
948	Histology	Spongy Bone	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420808303_manual_web-histology-spongy_bone.jpg.png	web-histology-spongy_bone.jpg	\N	\N	6	2026-07-07 10:40:09.034718
949	Histology	Thin Skin	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420818754_manual_web-histology-thin_skin.jpg.png	web-histology-thin_skin.jpg	\N	\N	6	2026-07-07 10:40:20.098174
950	Histology	Elastic Cartilage	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420832538_manual_web-histology-elastic_cartilage.png.png	web-histology-elastic_cartilage.png	\N	\N	6	2026-07-07 10:40:33.372833
951	Histology	Cerebrum	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420837811_manual_web-histology-cerebrum.jpg.png	web-histology-cerebrum.jpg	\N	\N	6	2026-07-07 10:40:38.639859
952	Histology	Cerebellar Cortex	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420846693_manual_web-histology-cerebellar_cortex.jpg.png	web-histology-cerebellar_cortex.jpg	\N	\N	6	2026-07-07 10:40:47.459902
953	Histology	Spinal Cord	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420850977_manual_web-histology-spinal_cord.jpg.png	web-histology-spinal_cord.jpg	\N	\N	6	2026-07-07 10:40:51.78279
954	Histology	Ureter	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420858194_manual_web-histology-ureter.jpg.png	web-histology-ureter.jpg	\N	\N	6	2026-07-07 10:40:59.128509
955	Histology	Prostate	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420867244_manual_web-histology-prostate.jpg.png	web-histology-prostate.jpg	\N	\N	6	2026-07-07 10:41:08.173772
956	Histology	Epididymis	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420874707_manual_web-histology-epididymis.jpg.png	web-histology-epididymis.jpg	\N	\N	6	2026-07-07 10:41:15.823538
957	Histology	Vas Deferens	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420880431_manual_web-histology-vas_deferens.jpg.png	web-histology-vas_deferens.jpg	\N	\N	6	2026-07-07 10:41:21.110482
958	Histology	Uterus	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420884282_manual_web-histology-uterus.jpg.png	web-histology-uterus.jpg	\N	\N	6	2026-07-07 10:41:25.115807
959	Histology	Fallopian Tube	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420888459_manual_web-histology-fallopian_tube.jpg.png	web-histology-fallopian_tube.jpg	\N	\N	6	2026-07-07 10:41:29.263098
770	Bone	Articulated Hand, Anterior view	Bilateral	Hand	The hand bones include carpals, metacarpals, and phalanges. The anterior view shows the palmar aspect, while the posterior view highlights the dorsal interossei.	anatomy-viva-images/1783372912605_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	6	\N	6	2026-07-06 21:21:53.412479
771	Bone	Articulated Hand, Posterior view	Bilateral	Hand	The hand bones include carpals, metacarpals, and phalanges. The anterior view shows the palmar aspect, while the posterior view highlights the dorsal interossei.	anatomy-viva-images/1783372913435_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	6	\N	6	2026-07-06 21:21:54.137329
772	Bone	Articulated Hand, Posterior view	Bilateral	Hand	The hand bones include carpals, metacarpals, and phalanges. The anterior view shows the palmar aspect, while the posterior view highlights the dorsal interossei.	anatomy-viva-images/1783372914166_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	6	\N	6	2026-07-06 21:21:54.841756
773	Bone	Articulated Hand, Anterior view	Bilateral	Hand	The hand bones include carpals, metacarpals, and phalanges. The anterior view shows the palmar aspect, while the posterior view highlights the dorsal interossei.	anatomy-viva-images/1783372914872_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	6	\N	6	2026-07-06 21:21:55.53603
826	Section Anatomy	Interior of the posterior half of the left eyeball	\N	\N	\N	anatomy-viva-images/1783404717231_manual_manual.png	manual	1296	\N	6	2026-07-07 06:11:58.194786
828	Section Anatomy	Transverse section of a portion of the spleen	\N	\N	\N	anatomy-viva-images/1783404733550_manual_manual.png	manual	1281	\N	6	2026-07-07 06:12:14.587628
829	Section Anatomy	Transverse section of the spleen	\N	\N	\N	anatomy-viva-images/1783404741466_manual_manual.png	manual	1280	\N	6	2026-07-07 06:12:22.390007
830	Section Anatomy	Section of part of human glomus caroticum	\N	\N	\N	anatomy-viva-images/1783404749126_manual_manual.png	manual	1277	\N	6	2026-07-07 06:12:30.030029
831	Section Anatomy	Section of a part of a suprarenal gland	\N	\N	\N	anatomy-viva-images/1783404756549_manual_manual.png	manual	1276	\N	6	2026-07-07 06:12:37.370602
960	Histology	Tongue (Circumvallate Papillae)	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420907329_manual_web-histology-tongue__circumvallate_papillae_.jpg.png	web-histology-tongue__circumvallate_papillae_.jpg	\N	\N	6	2026-07-07 10:41:48.01183
961	Histology	Tongue (Filiform & Fungiform Papillae)	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420916250_manual_web-histology-tongue__filiform_papillae_.jpg.png	web-histology-tongue__filiform_papillae_.jpg	\N	\N	6	2026-07-07 10:41:56.845386
774	Bone	Right Scapula, Anterior view	Right	Scapula	The scapula is a flat triangular bone with key landmarks such as the acromion, coracoid process, and glenoid cavity.	anatomy-viva-images/1783372946544_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	3	\N	6	2026-07-06 21:22:27.345483
775	Bone	Right Scapula, Posterior view	Right	Scapula	The scapula is a flat triangular bone with key landmarks such as the acromion, coracoid process, and glenoid cavity.	anatomy-viva-images/1783372947369_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	3	\N	6	2026-07-06 21:22:28.08606
776	Bone	Right Scapula, Anterior view with subscapularis	Right	Scapula	The scapula is a flat triangular bone with key landmarks such as the acromion, coracoid process, and glenoid cavity.	anatomy-viva-images/1783372948107_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	3	\N	6	2026-07-06 21:22:28.775154
777	Bone	Right Scapula, Posterior view with supraspinatus and infraspinatus	Right	Scapula	The scapula is a flat triangular bone with key landmarks such as the acromion, coracoid process, and glenoid cavity.	anatomy-viva-images/1783372948801_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	3	\N	6	2026-07-06 21:22:29.512468
778	Bone	Right Clavicle, Superior view	Right	Clavicle	The clavicle is an S-shaped bone with a sternal end and an acromial end. Key features include the conoid tubercle and subclavian groove.	anatomy-viva-images/1783372965023_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	2	\N	6	2026-07-06 21:22:45.650421
779	Bone	Right Clavicle, Inferior view	Right	Clavicle	The clavicle is an S-shaped bone with a sternal end and an acromial end. Key features include the conoid tubercle and subclavian groove.	anatomy-viva-images/1783372965696_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	2	\N	6	2026-07-06 21:22:46.209883
780	Bone	Right Radius and Ulna, Anterior view	Right	Forearm	The radius and ulna are shown with key points and articulations. The radius is lateral with a disc-shaped head, while the ulna is medial with a prominent olecranon.	anatomy-viva-images/1783372984534_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	5	\N	6	2026-07-06 21:23:05.341115
833	Section Anatomy	Section of thyroid gland of sheep	\N	\N	\N	anatomy-viva-images/1783404797723_manual_manual.png	manual	1267	\N	6	2026-07-07 06:13:18.631631
834	Section Anatomy	Section of portion of mamma	\N	\N	\N	anatomy-viva-images/1783404806301_manual_manual.png	manual	1264	\N	6	2026-07-07 06:13:27.265272
962	Histology	Pancreas	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783420987796_manual_web-histology-pancreas.jpg.png	web-histology-pancreas.jpg	\N	\N	6	2026-07-07 10:43:08.320275
963	Histology	Parotid Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421004868_manual_web-histology-parotid_gland.jpg.png	web-histology-parotid_gland.jpg	\N	\N	6	2026-07-07 10:43:25.752596
964	Histology	Compact Bone	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421019080_manual_web-histology-compact_bone.png.png	web-histology-compact_bone.png	\N	\N	6	2026-07-07 10:43:40.32006
965	Histology	Thick Skin	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421024240_manual_web-histology-thick_skin.jpg.png	web-histology-thick_skin.jpg	\N	\N	6	2026-07-07 10:43:44.705239
966	Histology	Urinary Bladder	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421029942_manual_web-histology-urinary_bladder.jpg.png	web-histology-urinary_bladder.jpg	\N	\N	6	2026-07-07 10:43:50.718117
967	Histology	Vagina	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421034927_manual_web-histology-vagina.jpg.png	web-histology-vagina.jpg	\N	\N	6	2026-07-07 10:43:55.649901
968	Histology	Liver	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421140792_manual_web-histology-liver.jpg.png	web-histology-liver.jpg	\N	\N	6	2026-07-07 10:45:41.749848
969	Histology	Pituitary Gland	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421161460_manual_web-histology-pituitary_gland.jpg.png	web-histology-pituitary_gland.jpg	\N	\N	6	2026-07-07 10:46:02.119945
970	Histology	Lymph Node	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421408243_manual_web-histology-lymph_node.jpg.png	web-histology-lymph_node.jpg	\N	\N	6	2026-07-07 10:50:09.116608
971	Histology	Palatine Tonsil	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421418568_manual_web-histology-palatine_tonsil.jpg.png	web-histology-palatine_tonsil.jpg	\N	\N	6	2026-07-07 10:50:19.645892
972	Histology	C-O Junction	\N	\N	Web-sourced high-quality histology slide (unlabeled)	anatomy-viva-images/1783421478103_manual_web-histology-c_o_junction.jpg.png	web-histology-c_o_junction.jpg	\N	\N	6	2026-07-07 10:51:19.252262
837	Section Anatomy	Right tympanic membrane as seen through a speculum	\N	\N	\N	anatomy-viva-images/1783404875047_manual_manual.png	manual	1297	\N	6	2026-07-07 06:14:35.838095
838	Section Anatomy	Vertical section of mucous membrane of human uterus	\N	\N	\N	anatomy-viva-images/1783404883455_manual_manual.png	manual	1259	\N	6	2026-07-07 06:14:44.499757
781	Bone	Right Radius and Ulna, Anterior view	Right	Forearm	The radius and ulna are shown with key points and articulations. The radius is lateral with a disc-shaped head, while the ulna is medial with a prominent olecranon.	anatomy-viva-images/1783373042109_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	5	\N	6	2026-07-06 21:24:02.792275
782	Bone	Right Radius and Ulna, Posterior view	Right	Forearm	The radius and ulna are shown with key points and articulations. The radius is lateral with a disc-shaped head, while the ulna is medial with a prominent olecranon.	anatomy-viva-images/1783373042845_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	5	\N	6	2026-07-06 21:24:03.502303
783	Bone	Right Radius and Ulna, Anterior view with muscles	Right	Forearm	The radius and ulna are shown with key points and articulations. The radius is lateral with a disc-shaped head, while the ulna is medial with a prominent olecranon.	anatomy-viva-images/1783373043524_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	5	\N	6	2026-07-06 21:24:04.176546
784	Bone	Right Radius and Ulna, Posterior view with muscles	Right	Forearm	The radius and ulna are shown with key points and articulations. The radius is lateral with a disc-shaped head, while the ulna is medial with a prominent olecranon.	anatomy-viva-images/1783373044188_manual_Osteology__1783358909020.pdf.png	Osteology__1783358909020.pdf	5	\N	6	2026-07-06 21:24:04.781977
839	Section Anatomy	Sagittal section through the pelvis of a newly born female child	\N	\N	\N	anatomy-viva-images/1783404912238_manual_manual.png	manual	1257	\N	6	2026-07-07 06:15:13.17718
840	Section Anatomy	Section of the ovary	\N	\N	\N	anatomy-viva-images/1783404920778_manual_manual.png	manual	1251	\N	6	2026-07-07 06:15:21.726112
841	Section Anatomy	Section of vesicular ovarian follicle of cat	\N	\N	\N	anatomy-viva-images/1783404928303_manual_manual.png	manual	1252	\N	6	2026-07-07 06:15:29.147417
842	Section Anatomy	Section of corpus cavernosum penis	\N	\N	\N	anatomy-viva-images/1783404936109_manual_manual.png	manual	1246	\N	6	2026-07-07 06:15:37.045795
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, type, created_at, attachment_url, attachment_name, attachment_type, scheduled_for, delivered_count, target_audience) FROM stdin;
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (key, value, updated_at) FROM stdin;
vapid_public_key	BDj0uGby08d6JPRmwmN3hO8D86g4FBVm1Giy9Odz8bto9DhxGfDy4kTnikNVAqma-ouMqaDLZxgnZZOmr7VARGU	2026-06-15 09:27:58.376408
vapid_private_key	29rfu_cL8xRDzzm2bcF2-wgSebGLSyatcfvwTT2v10U	2026-06-15 09:27:58.376408
\.


--
-- Data for Name: app_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_updates (id, title, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, admin_id, admin_name, action, entity_type, entity_id, details, created_at) FROM stdin;
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookmarks (id, user_id, resource_type, resource_id, resource_title, subject, created_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.books (id, title, subject, author, url, cover_url, download_count, created_at, created_by) FROM stdin;
2	Ib Singh Embryology	Anatomy	\N	https://fb280449-f988-4beb-8143-6ae1a9442933-00-1sak3l4a1tn4m.sisko.replit.dev/api/upload/pdf/serve/1781974206664_IB_Singh_s_Embryology_11th_Ed.pdf	\N	0	2026-06-20 16:50:13.911053	6
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendar_events (id, user_id, title, description, subject, start_time, end_time, color, created_at) FROM stdin;
\.


--
-- Data for Name: clinical_case_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinical_case_attempts (id, user_id, case_id, answer_text, ai_feedback, created_at, date_key) FROM stdin;
\.


--
-- Data for Name: clinical_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinical_cases (id, scenario, subject, model_answer, explanation, date_assigned, created_by, created_at, is_grand_round, grand_round_week, featured_attempt_id, winner_announced_at) FROM stdin;
16	A 28-year-old man sustains a mid-shaft fracture of the humerus after a road traffic accident. On examination, he is unable to extend his wrist and fingers, and there is loss of sensation over the dorsum of the hand. Which nerve is injured, and where does it run in relation to the fracture site?	Anatomy	Radial nerve — injured in the radial (spiral) groove of the humerus at mid-shaft level.	The radial nerve winds around the posterior aspect of the humerus in the spiral groove between the upper and middle thirds. A mid-shaft fracture typically injures it here, causing wrist drop (loss of wrist/finger extension) and sensory loss over the anatomical snuff box and dorsum of the hand. It is the most commonly injured nerve in humeral shaft fractures. The posterior interosseous branch (deep branch) spares sensation if only that branch is involved.	\N	\N	2026-07-07 17:34:09.4446	f	\N	\N	\N
17	A newborn baby cannot abduct and externally rotate the left arm after a difficult forceps delivery with shoulder dystocia. The arm hangs by the side in the 'waiter's tip' position. Which nerve roots are damaged, and what is this injury called?	Anatomy	Erb's palsy — injury to C5 and C6 nerve roots of the brachial plexus.	Excessive lateral flexion of the head away from the shoulder during delivery stretches the upper trunk of the brachial plexus (C5–C6). Muscles paralysed: deltoid (abduction), supraspinatus (initiation of abduction), infraspinatus/teres minor (external rotation), biceps (flexion and supination). The arm assumes a waiter's tip position: adducted, medially rotated, elbow extended, forearm pronated. Klumpke's palsy (C8–T1) causes claw hand and Horner's syndrome.	\N	\N	2026-07-07 17:34:10.983355	f	\N	\N	\N
18	A 45-year-old woman undergoes parotidectomy for a benign pleomorphic adenoma. Two months post-operatively, she notices that eating causes sweating and flushing of the skin over her cheek. What is this condition and what is its anatomical basis?	Anatomy	Frey's syndrome — aberrant regeneration of the auriculotemporal nerve (branch of V3).	The auriculotemporal nerve (V3) normally carries parasympathetic fibres (from the otic ganglion) to the parotid gland and sympathetic fibres to the sweat glands of the skin. After parotidectomy, regenerating parasympathetic fibres mistakenly innervate the sweat glands and cutaneous blood vessels instead of the parotid. Eating (which triggers salivation = parasympathetic stimulus) now also activates sweating and vasodilation of the overlying skin — gustatory sweating.	\N	\N	2026-07-07 17:34:12.696417	f	\N	\N	\N
19	A 60-year-old man presents with foot drop after sustaining a fibular neck fracture in a sports injury. He cannot dorsiflex or evert his foot, and there is sensory loss over the dorsum. Which nerve is injured and why is it vulnerable at this site?	Anatomy	Common peroneal (fibular) nerve — injured as it winds around the neck of the fibula.	The common peroneal nerve is the most commonly injured nerve in the lower limb. It is vulnerable where it winds superficially around the neck of the fibula, covered only by skin and subcutaneous tissue. Injury causes: loss of dorsiflexion (deep peroneal — tibialis anterior) and eversion (superficial peroneal — peroneus longus/brevis), causing foot drop with a high-stepping gait. Sensory loss affects the dorsum of the foot and lateral leg. The tibial nerve is rarely injured here.	\N	\N	2026-07-07 17:34:14.743476	f	\N	\N	\N
20	During appendicectomy through a McBurney's incision, a medical student is asked to identify the three layers of the anterior abdominal wall encountered after skin and superficial fascia. She also notices the appendix is situated retrocaecally in this patient. What are the three muscle layers and their fibre directions?	Anatomy	External oblique (downward-forward), Internal oblique (upward-forward), Transversus abdominis (horizontal).	A McBurney's grid-iron incision splits these three muscles along their fibre directions (muscle-splitting incision) to minimise bleeding and herniation. The layers from superficial to deep: (1) External oblique — fibres run downward and medially (hands-in-pockets direction); (2) Internal oblique — fibres run upward and medially, perpendicular to external oblique; (3) Transversus abdominis — fibres run horizontally. Below the umbilicus, all three aponeuroses pass anterior to the rectus abdominis (below arcuate line). A retrocaecal appendix (most common position, ~65%) requires full mobilisation of the caecum for safe identification.	\N	\N	2026-07-07 17:34:16.506785	f	\N	\N	\N
21	A 20-year-old mountaineer ascends rapidly to 5,000 m altitude. Over the next 48 hours, his breathing becomes deeper and faster even at rest, and blood gas analysis shows pH 7.48, PaCO₂ 30 mmHg, HCO₃⁻ 22 mEq/L. What is this compensatory response called, and how does the kidney respond over the following days?	Physiology	Hyperventilation causing respiratory alkalosis, compensated by renal bicarbonate excretion.	At high altitude, low PaO₂ stimulates peripheral chemoreceptors (carotid and aortic bodies), causing hyperventilation. Blowing off CO₂ raises pH (respiratory alkalosis). The kidney compensates over 24–72 hours by reducing HCO₃⁻ reabsorption (excreting more bicarbonate in urine), lowering plasma HCO₃⁻. This renal compensation shifts the pH back toward normal — a process called acclimatisation. The haemoglobin-O₂ dissociation curve initially shifts left (alkalosis), but 2,3-DPG increases later to shift it right, improving O₂ delivery.	\N	\N	2026-07-07 17:34:18.259502	f	\N	\N	\N
22	A 55-year-old man with chronic kidney disease is brought in confused. ECG shows tall peaked T waves, widened QRS, and absent P waves. Serum potassium is 7.2 mEq/L. Explain the physiological basis for these ECG changes.	Physiology	Hyperkalaemia reduces the resting membrane potential gradient, causing progressive depolarisation and conduction block.	Resting membrane potential (RMP) is maintained by the K⁺ equilibrium potential (Nernst equation). When extracellular K⁺ rises, the electrochemical gradient for K⁺ decreases, making the RMP less negative (partial depolarisation). Sequence of ECG changes with rising K⁺: (1) Peaked T waves (early repolarisation changes, K⁺ >5.5), (2) Prolonged PR, flat P waves (atrial conduction slows, K⁺ ~6.5), (3) Widened QRS — sine wave pattern (ventricular conduction slows, K⁺ ~7), (4) VF/asystole. Treatment: IV calcium gluconate (stabilises membranes), insulin + glucose (shifts K⁺ intracellularly), dialysis.	\N	\N	2026-07-07 17:34:20.160616	f	\N	\N	\N
23	A 30-year-old woman donates 450 mL of blood. Within seconds, she feels light-headed and her heart rate increases from 72 to 96 bpm. Explain the cardiovascular reflex mechanisms responsible for maintaining blood pressure in the first few minutes.	Physiology	Baroreceptor reflex — reduced stretch of arterial baroreceptors → sympathetic activation + vagal withdrawal → tachycardia and vasoconstriction.	Blood loss reduces venous return → ↓ stroke volume → ↓ cardiac output → ↓ arterial BP. Baroreceptors in the carotid sinus (CN IX) and aortic arch (CN X) sense reduced wall stretch and decrease their afferent firing. This disinhibits the vasomotor centre in the medulla: (1) Increased sympathetic outflow → ↑HR (SA node), ↑contractility, arteriolar vasoconstriction (↑TPR), venoconstriction (↑venous return); (2) Decreased parasympathetic (vagal) tone → ↑HR. Hormonal response (ADH, RAAS) takes minutes to hours. The net effect restores BP at the cost of increased HR and peripheral resistance.	\N	\N	2026-07-07 17:34:21.827854	f	\N	\N	\N
24	A physiology student breathes into a spirometer. The trace shows: tidal volume 500 mL, inspiratory reserve volume 3000 mL, expiratory reserve volume 1100 mL. The student's residual volume measured separately is 1200 mL. Calculate the total lung capacity (TLC) and functional residual capacity (FRC), and explain why residual volume cannot be measured by spirometry.	Physiology	TLC = 5800 mL; FRC = 2300 mL. Residual volume cannot be measured by spirometry because the lungs never fully empty — air is always trapped.	Calculations: FRC = ERV + RV = 1100 + 1200 = 2300 mL. Vital capacity (VC) = TV + IRV + ERV = 500 + 3000 + 1100 = 4600 mL. TLC = VC + RV = 4600 + 1200 = 5800 mL. Residual volume is the air remaining after maximal forced expiration — it cannot be expelled, so the spirometer bell never records it. It must be measured indirectly by helium dilution, nitrogen washout, or body plethysmography. FRC (= RV + ERV) is the resting lung volume at end of passive expiration, where elastic recoil of lungs equals chest wall outward recoil.	\N	\N	2026-07-07 17:34:23.74929	f	\N	\N	\N
25	A 25-year-old marathon runner collapses near the finish line. He is pale, clammy, and his urine output is <20 mL/hr. Plasma ADH is very high. Explain the role of ADH in restoring fluid balance, and name the receptor and second messenger involved in its renal action.	Physiology	ADH acts on V2 receptors (Gs-cAMP) in collecting duct principal cells to insert AQP2 channels, increasing water reabsorption.	Hypovolaemia (reduced blood volume/pressure) is the strongest non-osmotic stimulus for ADH (vasopressin) release from posterior pituitary via volume receptors in left atrium and baroreceptors. In the kidney: ADH binds V2 receptors (Gs protein) on principal cells of collecting duct → activates adenylyl cyclase → ↑cAMP → PKA activation → phosphorylation of AQP2 vesicles → fusion with apical membrane → free water reabsorption. AQP3/AQP4 on basolateral side are constitutively expressed. Net effect: concentrated urine (↑urine osmolality), water retention, restoration of blood volume.	\N	\N	2026-07-07 17:34:25.786775	f	\N	\N	\N
26	A 6-month-old baby presents with intellectual disability, fair skin, blue eyes, and a musty body odour. A urine ferric chloride test turns olive-green. A newborn screening test was not done. Which enzyme is deficient, and what dietary modification is required?	Biochemistry	Phenylalanine hydroxylase deficiency — Phenylketonuria (PKU). Diet: restrict phenylalanine, supplement tyrosine.	PKU is an autosomal recessive disorder of phenylalanine metabolism. Phenylalanine hydroxylase (requires BH4 cofactor) normally converts phenylalanine → tyrosine in the liver. Deficiency causes phenylalanine accumulation → conversion to phenylketones (phenylpyruvate, phenylacetate, phenyllactate) excreted in urine (musty odour). Excess phenylalanine inhibits tyrosinase (→ hypopigmentation) and competes with large neutral amino acid transporter (LAT1) at the BBB, reducing dopamine/serotonin synthesis → intellectual disability. Treatment: low-phenylalanine diet (avoiding high-protein foods), tyrosine supplementation (now essential amino acid), BH4 (sapropterin) in responsive cases.	\N	\N	2026-07-07 17:34:27.925485	f	\N	\N	\N
27	A 20-year-old West African male develops sudden haemolytic anaemia and haemoglobinuria after starting primaquine for malaria prophylaxis. His CBC shows normochromic anaemia with Heinz bodies on peripheral smear. Which enzyme is deficient and what is the biochemical mechanism of haemolysis?	Biochemistry	G6PD (Glucose-6-Phosphate Dehydrogenase) deficiency — impaired GSH regeneration → oxidative haemolysis.	G6PD is the rate-limiting enzyme of the hexose monophosphate (HMP) shunt / pentose phosphate pathway. It reduces NADP⁺ → NADPH. NADPH is essential for regenerating glutathione (GSH) via glutathione reductase. GSH neutralises ROS and maintains haemoglobin in the ferrous (Fe²⁺) state. Primaquine (and other oxidant drugs: dapsone, sulphonamides) generates H₂O₂. In G6PD deficiency, NADPH is not replenished → GSH depleted → H₂O₂ oxidises haemoglobin → methaemoglobin → denatured Heinz bodies → rigid RBCs removed by spleen → haemolysis. X-linked recessive — males affected more severely.	\N	\N	2026-07-07 17:34:29.623369	f	\N	\N	\N
28	A 50-year-old alcoholic man on anti-tuberculosis therapy (isoniazid) presents with burning tingling in his hands and feet. Nerve conduction studies confirm peripheral neuropathy. Which vitamin is depleted, and what is the biochemical role of its active form?	Biochemistry	Pyridoxine (Vitamin B6) deficiency — INH inhibits pyridoxal kinase, depleting PLP (pyridoxal-5-phosphate).	Isoniazid (INH) is a structural analogue of pyridoxine and inhibits pyridoxal kinase, blocking conversion of pyridoxine to its active coenzyme form PLP (pyridoxal-5-phosphate). PLP is a coenzyme for >100 enzymes, critically including: (1) Aminotransferases (ALT, AST) — transamination; (2) Amino acid decarboxylases — synthesis of neurotransmitters (GABA, dopamine, serotonin, histamine); (3) δ-ALA synthase — haem synthesis; (4) Cystathionine β-synthase — homocysteine → cystathionine. PLP depletion impairs GABA synthesis → peripheral neuropathy + seizures. Prevention: co-prescribe pyridoxine 25–50 mg/day with INH.	\N	\N	2026-07-07 17:34:31.594185	f	\N	\N	\N
29	A 35-year-old chronic alcoholic is brought to casualty confused, with nystagmus and ataxia. Blood glucose is normal. He is given IV thiamine before IV glucose. Why must thiamine be given BEFORE glucose in alcoholics, and what is the biochemical basis of his neurological symptoms?	Biochemistry	Wernicke's encephalopathy — thiamine (B1) deficiency. Giving glucose first exhausts residual thiamine, precipitating acute brain damage.	Thiamine pyrophosphate (TPP) is the active coenzyme for: (1) Pyruvate dehydrogenase (PDH) — pyruvate → acetyl-CoA; (2) α-ketoglutarate dehydrogenase — TCA cycle; (3) Transketolase — HMP shunt; (4) Branched-chain α-keto acid dehydrogenase. In thiamine deficiency, PDH is impaired → pyruvate accumulates → excess lactate (lactic acidosis) and alanine → impaired ATP production in neurons → Wernicke's (confusion, nystagmus, ataxia — 'CNAl'). Administering glucose without thiamine further drives glycolysis, consuming residual thiamine at PDH → acute neuronal death. Mammillary bodies and periaqueductal grey are most vulnerable. Wernicke's untreated → Korsakoff's (irreversible confabulation).	\N	\N	2026-07-07 17:34:34.618629	f	\N	\N	\N
30	A 2-year-old malnourished child from a food-insecure region presents with bilateral pitting oedema of the legs, a protuberant abdomen, and fatty liver on ultrasound, but no generalised wasting. He is irritable and has depigmented, flaky skin. His serum albumin is 1.8 g/dL. What is this condition, and explain the biochemical basis for the oedema and fatty liver?	Biochemistry	Kwashiorkor — protein-deficient malnutrition. Hypoalbuminaemia → oedema; impaired apolipoprotein synthesis → fat accumulates in liver.	Kwashiorkor (protein deficiency despite adequate calories) vs Marasmus (total calorie deficiency — severe wasting). Key biochemical defects: (1) Oedema: low serum albumin (main plasma oncotic protein) → ↓plasma oncotic pressure → fluid shifts into interstitium (Starling forces). (2) Fatty liver: liver cannot export VLDL without adequate apolipoprotein B-100 (apoB-100) — a large protein requiring continuous synthesis. Protein deficiency impairs apoB-100 production → triglycerides cannot be packaged into VLDL → hepatic steatosis. (3) Depigmented skin/hair: tyrosinase (requires tyrosine from protein) impaired → reduced melanin synthesis. (4) Irritability/apathy: low tryptophan → reduced serotonin synthesis.	\N	\N	2026-07-07 17:34:36.32329	f	\N	\N	\N
31	A 50-year-old woman undergoes mastectomy for breast carcinoma. Post-operatively, she develops 'winged scapula' — the medial border of the scapula protrudes outward when she pushes against a wall. Which nerve was damaged during axillary dissection?	Anatomy	Long thoracic nerve (nerve of Bell) — C5, C6, C7 — damaged during axillary lymph node clearance.	The long thoracic nerve (C5–C7) runs superficially along the lateral thoracic wall to supply serratus anterior. This muscle holds the scapula against the thoracic wall and rotates it upward during arm elevation. Damage causes paralysis of serratus anterior → medial border of scapula lifts away from chest wall ('winging'), especially when the patient pushes against resistance. Other consequences: inability to raise arm above 90° (no upward scapular rotation). It is the most commonly injured nerve in axillary surgery. Not to be confused with thoracodorsal nerve (latissimus dorsi) or medial pectoral nerve.	\N	\N	2026-07-07 17:41:42.909339	f	\N	\N	\N
32	A 35-year-old man is brought in after a motorcycle accident with severe pelvic fracture. He cannot pass urine and there is blood at the urethral meatus. A urethral catheter cannot be passed. Where is the most likely site of urethral injury in blunt pelvic trauma, and what is its anatomical basis?	Anatomy	Membranous urethra — at the apex of the prostate, where the urethra pierces the perineal membrane (urogenital diaphragm).	The male urethra has four parts: intramural (preprostatic), prostatic, membranous, and spongy. The membranous urethra is the shortest and least mobile segment — it is firmly attached to the perineal membrane and the puboprostatic ligaments. In pelvic fractures with disruption of the pubic symphysis, shearing forces tear the urethra at its most fixed point — the junction of the membranous urethra with the prostate apex. Signs: blood at meatus, inability to void, butterfly haematoma in perineum, high-riding prostate on PR examination. Management: suprapubic catheter — never attempt urethral catheterisation as it risks completing a partial tear.	\N	\N	2026-07-07 17:41:44.640965	f	\N	\N	\N
33	A 25-year-old cricketer presents with numbness over the little finger and medial half of the ring finger after a fall on the elbow. He also has weakness of finger abduction and adduction, and a positive Froment's sign. Which nerve is injured and what is the anatomical basis for this injury pattern?	Anatomy	Ulnar nerve at the medial epicondyle of the humerus — causes ulnar claw hand and loss of intrinsic muscle function.	The ulnar nerve passes behind the medial epicondyle in the cubital tunnel, where it is directly subcutaneous and vulnerable to injury. Cubital tunnel syndrome / acute injury causes: (1) Sensory loss — medial 1.5 fingers (dorsum and palm); (2) Motor: weakness of all intrinsic muscles of hand (lumbricals 3&4, all interossei, hypothenar muscles, adductor pollicis); (3) Claw hand — ring and little fingers (3rd/4th lumbricals paralysed — MCP hyperextension, IP flexion); (4) Froment's sign positive — patient grips paper with IPJ flexion of thumb (FPL substituting for adductor pollicis which is ulnar-innervated). The ulnar nerve provides sensory supply to medial 1.5 fingers and motor supply to most intrinsic hand muscles (radial nerve does NOT supply intrinsic hand muscles).	\N	\N	2026-07-07 17:41:46.464918	f	\N	\N	\N
34	During thyroidectomy, the surgeon clips a vessel near the inferior pole of the thyroid. Post-operatively, the patient has a hoarse voice. Which structure was most likely injured, where does it run in relation to the inferior thyroid artery, and what specific action is lost?	Anatomy	Recurrent laryngeal nerve (RLN) — runs in the tracheo-oesophageal groove close to the inferior thyroid artery. Injury causes paralysis of all intrinsic laryngeal muscles (ipsilateral), causing hoarseness.	The RLN supplies all intrinsic laryngeal muscles except cricothyroid (external laryngeal nerve). Right RLN loops around the right subclavian artery; left RLN loops around the arch of aorta — so the left RLN has a longer course and is more at risk in mediastinal pathology. In thyroidectomy, the danger zone is where the RLN crosses the inferior thyroid artery (the relationship is variable — it may pass anterior, posterior, or between branches). Unilateral RLN injury → hoarse/breathy voice (ipsilateral cord fixed in paramedian/intermediate position). Bilateral injury → respiratory distress/stridor (both cords adduct, obstructing airway) — requires emergency tracheostomy. External laryngeal nerve injury (close to superior thyroid artery) → paralysis of cricothyroid only → loss of high-pitched phonation, weak voice.	\N	\N	2026-07-07 17:41:48.610323	f	\N	\N	\N
35	A 4-month-old baby has a palpable olive-shaped mass in the right hypochondrium after feeding. The baby vomits forcefully immediately after every feed (projectile, non-bilious). What is the anatomical structure involved, and why is the vomiting non-bilious?	Anatomy	Pyloric stenosis — hypertrophy of the pyloric sphincter. Non-bilious because the obstruction is proximal to the ampulla of Vater where bile enters the duodenum.	The pylorus is the junction between the stomach and the first part of the duodenum, guarded by the pyloric sphincter (a ring of smooth muscle). In hypertrophic pyloric stenosis, this muscle hypertrophies after birth (typically presents 2–8 weeks), causing gastric outlet obstruction. Key anatomy: the common bile duct and pancreatic duct join at the hepatopancreatic ampulla (of Vater), which opens into the second part of the duodenum. Since the obstruction is at the pylorus — PROXIMAL to the ampulla — bile cannot reflux into the vomitus, making it non-bilious (as opposed to duodenal atresia distal to the ampulla which causes bilious vomiting). The 'olive' is palpable in the epigastrium/right hypochondrium. Metabolic consequence: hypochloraemic, hypokalaemic metabolic alkalosis (loss of HCl).	\N	\N	2026-07-07 17:41:50.469633	f	\N	\N	\N
36	A medical student presses firmly on the right carotid sinus of a patient with supraventricular tachycardia (SVT) at 180 bpm. Within seconds, the heart rate drops to 72 bpm. Explain the complete reflex arc responsible for this therapeutic manoeuvre.	Physiology	Carotid sinus massage → baroreceptor stretch → CN IX → NTS → vagal (CN X) activation → SA node slowed → bradycardia.	The carotid sinus contains high-pressure baroreceptors (mechanoreceptors in the adventitia of the internal carotid artery at its origin). External pressure mimics hypertension by increasing wall stretch. Reflex arc: (1) Afferent: Hering's nerve (branch of CN IX / glossopharyngeal) → nucleus tractus solitarius (NTS) in medulla. (2) NTS activates the dorsal vagal motor nucleus (DVN) → increases efferent vagal (CN X) activity to the SA and AV nodes. (3) Acetylcholine at M2 receptors: ↑K⁺ conductance → hyperpolarises SA nodal cells → slows spontaneous depolarisation → ↓HR. (4) AV nodal conduction also slows → may terminate SVT by breaking the re-entry circuit. The vasomotor centre is simultaneously inhibited → vasodilation. This is used therapeutically for SVT, and also to differentiate sinus tachycardia (gradual slowing) from SVT (abrupt termination or no response).	\N	\N	2026-07-07 17:41:52.381398	f	\N	\N	\N
37	A 3-year-old child is brought in after accidentally swallowing multiple iron tablets. She develops severe acidosis. Blood gas: pH 7.10, PaCO₂ 20 mmHg, HCO₃⁻ 6 mEq/L. Calculate the anion gap, state the type of acid-base disorder, and explain the compensation present.	Physiology	High anion gap metabolic acidosis (AG = 30 mEq/L) with appropriate respiratory compensation (hyperventilation — Kussmaul breathing).	Anion Gap (AG) = Na⁺ − (Cl⁻ + HCO₃⁻). Normal Na≈140, Cl≈105: AG = 140 − (105 + 6) = 29–30 mEq/L (normal 8–12). High AG = accumulation of unmeasured anions (here: iron-induced lactic acidosis + free radical damage to mitochondria). Metabolic acidosis: pH↓, HCO₃⁻↓. Respiratory compensation: CO₂ blown off (PaCO₂↓). Expected PaCO₂ (Winter's formula) = 1.5 × 6 + 8 ± 2 = 17–21 mmHg → measured 20 = appropriate compensation. Kussmaul breathing (deep, sighing) is the clinical sign. MUDPILES causes of high AG: Methanol, Uraemia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates.	\N	\N	2026-07-07 17:41:54.015393	f	\N	\N	\N
38	A research study measures glomerular filtration rate (GFR) using inulin clearance. A student injects inulin and measures: plasma inulin concentration = 1 mg/mL, urine inulin concentration = 125 mg/mL, urine flow rate = 1 mL/min. Calculate the GFR. Why is inulin — not glucose or urea — used as the gold standard for GFR measurement?	Physiology	GFR = 125 mL/min. Inulin is freely filtered and neither secreted nor reabsorbed — its clearance equals GFR exactly.	Clearance formula: C = (U × V) / P = (125 × 1) / 1 = 125 mL/min. This equals the normal GFR. Inulin is the gold standard because it is: (1) Freely filtered at the glomerulus (not protein-bound, small enough); (2) Not secreted by tubules; (3) Not reabsorbed by tubules; (4) Not metabolised by the kidney. Therefore clearance = GFR. Why not glucose? — glucose is completely reabsorbed (clearance = 0). Why not urea? — urea is filtered AND reabsorbed (40–50%), so clearance underestimates GFR. Creatinine overestimates GFR slightly (tubular secretion). Clinically, creatinine clearance is used as an approximation; eGFR formulas (CKD-EPI, MDRD) adjust further.	\N	\N	2026-07-07 17:41:55.919161	f	\N	\N	\N
39	A 28-year-old pregnant woman at term has an epidural anaesthetic. Her blood pressure drops to 80/50 mmHg. The anaesthetist tilts the bed 15° to the left. Explain the physiological mechanism behind her hypotension and why left lateral tilt corrects it.	Physiology	Aortocaval compression — gravid uterus compresses the inferior vena cava (IVC) in supine position → ↓venous return → ↓CO → hypotension. Left tilt displaces uterus off IVC.	At term, the gravid uterus can weigh 5–8 kg. In the supine position, this mass compresses the IVC against the lumbar vertebrae (L4–L5), dramatically reducing venous return from the lower body to the right heart. Reduced preload → ↓stroke volume (Frank-Starling) → ↓CO → ↓BP (supine hypotension syndrome of pregnancy). The aorta may also be compressed, worsening uteroplacental blood flow. Sympathetic block from epidural exacerbates this by abolishing the compensatory vasoconstriction. Left lateral tilt of 15° (or left uterine displacement) mechanically moves the uterus off the IVC, restoring venous return. In any pregnant woman beyond 20 weeks, always avoid pure supine positioning — CPR guidelines also recommend left tilt or manual left displacement during cardiac arrest in pregnancy.	\N	\N	2026-07-07 17:41:57.476139	f	\N	\N	\N
40	A 19-year-old student with Type 1 diabetes forgets his insulin and develops Kussmaul breathing, a fruity smell on his breath, and a blood glucose of 22 mmol/L. Blood gases show pH 7.15, HCO₃⁻ 8 mEq/L, PaCO₂ 18 mmHg. What is the anion gap type of acidosis, and explain the metabolic pathway producing ketones from fatty acids?	Physiology	High anion gap metabolic acidosis — diabetic ketoacidosis (DKA). Ketones produced by hepatic beta-oxidation of fatty acids → acetyl-CoA → ketone bodies (acetoacetate, β-hydroxybutyrate, acetone).	In absolute insulin deficiency: (1) Glucose cannot enter cells → starvation state despite hyperglycaemia; (2) Glucagon dominates → activates hormone-sensitive lipase in adipose → FFA mobilised to liver; (3) In liver: FFA → beta-oxidation → excess acetyl-CoA (TCA cycle overwhelmed, oxaloacetate diverted to gluconeogenesis); (4) Excess acetyl-CoA → ketogenesis: acetoacetate (enzymatic condensation) → β-hydroxybutyrate (reduced, predominates in severe DKA) or acetone (spontaneous decarboxylation — fruity breath). Ketone bodies are weak acids → deplete HCO₃⁻ → HAGMA. Treatment: insulin (stops ketogenesis — not just lowers glucose), IV fluids, K⁺ replacement (insulin drives K⁺ intracellularly).	\N	\N	2026-07-07 17:41:59.242499	f	\N	\N	\N
41	A 9-month-old baby with Ashkenazi Jewish parents presents with an exaggerated startle response, progressive neurological deterioration, cherry-red spot on fundoscopy, and no organomegaly. He has been regressing developmentally. Which enzyme is deficient, which substrate accumulates, and why does only the macula show the cherry-red spot?	Biochemistry	Hexosaminidase A deficiency — Tay-Sachs disease. GM2 ganglioside accumulates in neurons. Cherry-red spot: fovea has no ganglion cell layer, so the underlying choroidal red shows through surrounded by white ganglioside-laden cells.	Tay-Sachs is an autosomal recessive lysosomal storage disorder. Hexosaminidase A (α-subunit) normally cleaves GM2 ganglioside. Deficiency → GM2 accumulates in lysosomes of neurons (CNS). No organomegaly because hepatic cells have minimal GM2. Cherry-red spot mechanism: ganglion cells throughout the retina fill with lipid → appear pale/white. The fovea centralis has no ganglion cell layer (cells displaced peripherally to allow high-acuity vision) → foveal choroidal vasculature (red) is seen normally, surrounded by white opaque retina → classic cherry-red spot. Also seen in: Niemann-Pick (sphingomyelinase deficiency), GM1 gangliosidosis. Distinguished from Sandhoff (hexosaminidase A+B deficiency) which HAS organomegaly.	\N	\N	2026-07-07 17:42:02.281716	f	\N	\N	\N
42	A 2-year-old child presents with hepatosplenomegaly, coarse facial features, corneal clouding, joint stiffness, and recurrent respiratory infections. Urine shows increased dermatan sulphate and heparan sulphate. Mental retardation is present. Which enzyme is deficient, and what class of disorder is this?	Biochemistry	Alpha-L-iduronidase deficiency — Hurler syndrome (MPS Type I). A mucopolysaccharidosis (MPS) — lysosomal storage of glycosaminoglycans (GAGs).	Mucopolysaccharidoses (MPS) are autosomal recessive lysosomal storage disorders of GAG (formerly mucopolysaccharide) degradation. In Hurler's: α-L-iduronidase cannot cleave iduronic acid residues from dermatan and heparan sulphate → progressive lysosomal accumulation in multiple organs. Clinical: 'gargoyle' facies (coarse features from GAG deposition in skin/bone), hepatosplenomegaly (Kupffer cells + reticuloendothelial), corneal clouding (stromal GAG deposition), restricted joint movement (joint capsule thickening), cardiac valve disease, intellectual disability, recurrent URTIs (tonsillar/adenoid enlargement). Urine: elevated GAGs. Hunter syndrome (MPS II) = iduronate sulphatase deficiency (X-linked, NO corneal clouding). Morquio (MPS IV) = no intellectual disability. Sanfilippo (MPS III) = severe ID, minimal somatic features.	\N	\N	2026-07-07 17:42:04.165339	f	\N	\N	\N
43	A 40-year-old obese man with type 2 diabetes is started on metformin. His fasting blood glucose falls from 12 to 7 mmol/L without weight gain or hypoglycaemia. Explain the primary mechanism of action of metformin at the biochemical level, and why it does not cause hypoglycaemia.	Biochemistry	Metformin activates AMPK → inhibits hepatic gluconeogenesis (blocks Complex I of ETC → ↓ATP/AMP ratio → AMPK activation → inhibits FBPase-2, PEPCK, G6Pase). No hypoglycaemia because it is glucose-dependent, not insulin-dependent.	Metformin's primary site of action is the liver. Mechanism: (1) Inhibits mitochondrial Complex I (NADH dehydrogenase) of the electron transport chain → ↓ATP production → ↑AMP:ATP ratio → activates AMP-activated protein kinase (AMPK); (2) AMPK phosphorylates and inhibits key gluconeogenic enzymes: fructose-1,6-bisphosphatase (FBPase), and reduces expression of PEPCK and glucose-6-phosphatase (G6Pase); (3) Result: ↓hepatic glucose production (HGP) → ↓fasting blood glucose. Secondary effects: improved insulin sensitivity, ↓intestinal glucose absorption. No hypoglycaemia because: metformin does NOT stimulate insulin secretion; it only works when glucose is high (hepatic glucose production is elevated). Compare with sulphonylureas (stimulate insulin regardless of glucose → hypoglycaemia risk). Metformin is weight-neutral or causes mild weight loss.	\N	\N	2026-07-07 17:42:05.843936	f	\N	\N	\N
44	A 45-year-old alcoholic man presents with pellagra — dermatitis on sun-exposed areas, diarrhoea, and dementia (the '3 Ds'). His diet consists almost entirely of maize (corn). Which vitamin is deficient and why does a maize-based diet specifically cause this deficiency?	Biochemistry	Niacin (Vitamin B3 / Nicotinic acid) deficiency. Maize is high in leucine (inhibits tryptophan→NAD synthesis) and niacin is bound as niacytin (unavailable without alkali treatment — nixtamalisation).	Niacin exists as nicotinamide adenine dinucleotide (NAD⁺/NADH) and NADP⁺/NADPH — essential coenzymes in oxidation-reduction reactions (glycolysis, TCA cycle, fatty acid synthesis, ETC). It can be synthesised endogenously from tryptophan (60:1 ratio — 60 mg tryptophan → 1 mg niacin; requires B2, B6, Fe²⁺). In a maize diet: (1) Niacin is present as niacytin (bound to polysaccharides) — not bioavailable unless treated with alkali (nixtamalisation, as done in Mexico — explaining why pellagra was rare there despite maize staple); (2) High leucine in maize inhibits quinolinate phosphoribosyltransferase → blocks tryptophan→NAD conversion; (3) Tryptophan content in maize protein (zein) is also low. Pellagra: dermatitis (Casal necklace — photosensitive, symmetrical), diarrhoea, dementia, and if untreated — death ('4th D'). Also seen in carcinoid syndrome (tryptophan diverted to serotonin) and Hartnup disease (tryptophan malabsorption).	\N	\N	2026-07-07 17:42:07.351174	f	\N	\N	\N
45	A 6-year-old boy presents with recurrent episodes of severe fasting hypoglycaemia with no ketonuria. Between episodes he has mild hyperuricaemia, hyperlipidaemia, and a massively enlarged liver. A liver biopsy shows massive glycogen accumulation. Which enzyme is deficient and what is the biochemical reason for the absence of ketones despite severe hypoglycaemia?	Biochemistry	Glucose-6-phosphatase deficiency — Von Gierke disease (GSD Type I). No ketones because excess glucose-6-phosphate drives lipogenesis → elevated malonyl-CoA → inhibits CPT-1 → blocks fatty acid entry into mitochondria → no beta-oxidation → no ketogenesis.	GSD Type I (Von Gierke) is the most common glycogen storage disease. Glucose-6-phosphatase (in liver/kidney ER) normally cleaves G6P → free glucose for export. Deficiency: G6P accumulates → cannot produce free glucose → severe fasting hypoglycaemia. G6P is diverted to: (1) Glycogen synthesis → hepatomegaly (liver storage); (2) Glycolysis → pyruvate → excess acetyl-CoA → lipogenesis → hypertriglyceridaemia (VLDL overproduction) → hyperlipidaemia/xanthomas; (3) HMP shunt → ribose-5-phosphate overproduction → purine synthesis → gout/hyperuricaemia. NO KETONES: excess lipogenesis → elevated malonyl-CoA (first intermediate in fatty acid synthesis) → allosterically inhibits carnitine palmitoyltransferase I (CPT-1) → fatty acids cannot enter mitochondria → no beta-oxidation → no ketone bodies. Treatment: continuous glucose (cornstarch), avoid fasting.	\N	\N	2026-07-07 17:42:09.262892	f	\N	\N	\N
46	A 45-year-old man is brought to the emergency after a road accident. He has a fracture of the surgical neck of the humerus. On examination, there is loss of sensation over the 'regimental badge' area and inability to abduct the arm beyond 15°. Which nerve is injured and what muscle is paralysed?	Anatomy	The axillary nerve (C5, C6) is injured as it winds around the surgical neck of the humerus. The deltoid muscle is paralysed causing inability to abduct the arm (15–90°). The teres minor may also be affected. Sensation is lost over the lower half of the deltoid — the 'regimental badge' area. The supraspinatus initiates abduction (0–15°) and is intact.	The axillary nerve is most vulnerable at the surgical neck of the humerus. It supplies the deltoid (abduction 15–90°) and teres minor, and gives the upper lateral cutaneous nerve of the arm supplying the regimental badge area. This is a high-yield anatomy correlation tested in MBBS exams.	\N	\N	2026-07-12 17:29:53.475084	f	\N	\N	\N
47	A 60-year-old woman develops wrist drop after prolonged compression of the axilla by a crutch. She cannot extend the wrist or fingers. Sensation is intact over the dorsum of the hand but lost over the lateral forearm. Which nerve is affected and where is the lesion?	Anatomy	The radial nerve is injured at the spiral groove of the humerus (Saturday night palsy / crutch palsy). Wrist drop occurs due to paralysis of wrist and finger extensors. Sensation is lost over the posterior forearm (posterior cutaneous nerve of forearm). Sensation over the dorsum of the hand may be partially preserved depending on level. Brachioradialis and triceps are spared in mid-humeral injuries.	The radial nerve is most vulnerable in the spiral groove of the humerus. Crutch palsy involves compression at the axilla, sparing triceps. The clinical hallmark is wrist drop with loss of finger extension. Must distinguish from high (above spiral groove) vs low (near elbow) lesions.	\N	\N	2026-07-12 17:29:55.34267	f	\N	\N	\N
48	A 35-year-old pregnant woman at 36 weeks develops difficulty breathing lying flat (orthopnea). Echocardiography shows no cardiac disease. What anatomical changes during pregnancy explain her symptoms?	Anatomy	The enlarging uterus elevates the diaphragm by approximately 4 cm, reducing lung functional residual capacity (FRC). The heart is displaced upward and laterally, giving a horizontal axis on ECG. Blood volume increases 40–50%. Orthopnea occurs because the supine position further pushes abdominal contents against the diaphragm. The inferior vena cava is also compressed causing reduced venous return.	Pregnancy causes significant anatomical changes: diaphragm elevation, cardiac displacement, increased thoracic circumference, and aortocaval compression. These are high-yield for 1st year anatomy viva regarding thoracic and abdominal anatomy applied to clinical scenarios.	\N	\N	2026-07-12 17:29:56.912778	f	\N	\N	\N
49	A newborn is noted to have a bulging, cystic mass at the base of the spine that transilluminates. The baby has no neurological deficit and moves all four limbs normally. What is the diagnosis and what vertebral defect underlies it?	Anatomy	This is a meningocele — herniation of meninges and CSF through a defect in the vertebral arch (spina bifida), without spinal cord involvement. The transillumination confirms it is fluid-filled. Since there is no neurological deficit, the spinal cord is not herniated (distinguishing it from myelomeningocele). The defect arises from failure of fusion of the vertebral arches (neural tube defect).	Spina bifida results from failure of vertebral arch fusion during development. Meningocele = meninges only; myelomeningocele = cord + meninges (causes neurological deficits). Associated with folate deficiency in early pregnancy. High-yield embryology + clinical anatomy.	\N	\N	2026-07-12 17:29:58.451166	f	\N	\N	\N
50	A patient undergoes a mastectomy and axillary lymph node dissection. Post-operatively, she is unable to abduct the arm above 90° and has winging of the scapula. Which nerve has been injured and what is the clinical significance?	Anatomy	The long thoracic nerve of Bell (C5, C6, C7) has been injured. It supplies the serratus anterior muscle, which holds the medial border of the scapula against the thoracic wall and is essential for raising the arm above 90° (rotating the glenoid upward). When paralysed, the medial scapular border lifts off the chest wall — 'winged scapula'. This is a known complication of axillary surgery.	The long thoracic nerve runs on the lateral chest wall and is vulnerable during axillary dissection. Serratus anterior is crucial for arm elevation above 90° and scapular stabilisation. Winged scapula is the classic sign. Common MBBS exam question linking surgical anatomy to nerve injury.	\N	\N	2026-07-12 17:30:00.098465	f	\N	\N	\N
51	A 55-year-old man presents with sudden severe headache ('thunderclap headache'), neck stiffness, and photophobia. CT scan is normal. Lumbar puncture shows xanthochromic CSF with red blood cells. What is the diagnosis and describe the anatomical site of bleeding?	Anatomy	Subarachnoid haemorrhage (SAH), most commonly from rupture of a berry aneurysm at the junction of the anterior communicating artery or posterior communicating artery — bifurcation points of the Circle of Willis. Blood enters the subarachnoid space (between arachnoid and pia mater). Xanthochromia develops 2–4 hours after SAH due to bilirubin from haemoglobin breakdown. CSF circulates through subarachnoid cisterns.	SAH classically presents with thunderclap headache. The subarachnoid space contains CSF and the cerebral vasculature. Berry aneurysms form at bifurcations due to defects in the media. Circle of Willis anatomy — anterior communicating, posterior communicating, and middle cerebral arteries — is high-yield for 1st year anatomy.	\N	\N	2026-07-12 17:30:01.778392	f	\N	\N	\N
52	A 30-year-old carpenter presents with pain and tingling in the thumb, index, and middle fingers, worse at night. He reports relief by shaking the hand. On examination, Tinel's sign and Phalen's test are positive. Which nerve is compressed and through what anatomical structure?	Anatomy	Carpal tunnel syndrome — compression of the median nerve (C6, C7, T1) within the carpal tunnel, which is bounded by the flexor retinaculum anteriorly and the carpal bones posteriorly. The median nerve supplies the lateral 3½ fingers (thumb, index, middle, half of ring finger). LOAF muscles — Lumbricals (1st, 2nd), Opponens pollicis, Abductor pollicis brevis, Flexor pollicis brevis — are supplied by the median nerve and may show wasting in chronic cases.	The carpal tunnel contains the median nerve and 9 flexor tendons. The flexor retinaculum forms its roof. Carpal tunnel syndrome is the most common entrapment neuropathy. Tinel's: percussion over wrist causes tingling. Phalen's: wrist flexion for 60 seconds reproduces symptoms. LOAF muscles for thenar eminence.	\N	\N	2026-07-12 17:30:03.364995	f	\N	\N	\N
53	After a cholecystectomy, a patient develops jaundice and the surgical team suspects bile duct injury. A hepatobiliary scan shows bile leaking below the liver. Describe the anatomical relationship that makes the bile duct vulnerable during cholecystectomy.	Anatomy	The hepatocystic triangle (Calot's triangle) — bounded by the cystic duct, common hepatic duct, and the inferior border of the liver — is the key danger zone. The cystic artery (usually a branch of the right hepatic artery) runs within this triangle. Anatomical variations are common: the right hepatic artery may loop into the triangle; aberrant bile ducts of Luschka drain directly into the gallbladder bed. Failure to define this triangle leads to bile duct injury.	Calot's triangle is the surgical key to safe cholecystectomy. Critical view of safety requires isolating the cystic duct and cystic artery as the only two structures entering the gallbladder. Bile duct injuries are the most serious complication. Anatomical variants of the cystic artery and hepatic arteries must be identified.	\N	\N	2026-07-12 17:30:05.103796	f	\N	\N	\N
54	A 40-year-old man is stabbed in the left 5th intercostal space in the mid-axillary line. He develops haemopneumothorax. Describe which structures are traversed by the knife and the correct site for emergency chest drain insertion.	Anatomy	Structures traversed: skin → superficial fascia → serratus anterior → 5th intercostal muscles (external, internal, innermost) → parietal pleura. The neurovascular bundle (intercostal nerve, artery, vein) lies in the costal groove under the inferior border of the rib above — knife injury near the upper rib margin risks this bundle. Emergency chest drain is inserted in the 'safe triangle': 4th/5th intercostal space, anterior axillary line, just above the upper border of the 6th rib to avoid the neurovascular bundle.	The VAN mnemonic (Vein, Artery, Nerve) runs in the costal groove under the lower rib border. Drains must enter above the upper border of the lower rib to avoid it. The safe triangle avoids the nipple (mammary artery), axillary vessels, and long thoracic nerve. This anatomy underpins safe thoracentesis and chest drain insertion.	\N	\N	2026-07-12 17:30:06.664955	f	\N	\N	\N
55	A medical student notes that a patient with a pituitary macroadenoma has bitemporal hemianopia. Explain the anatomical pathway of the visual fibres that accounts for this visual field defect.	Anatomy	The optic chiasm lies directly above the pituitary gland in the suprasellar cistern. Nasal retinal fibres (which carry temporal visual field information) decussate at the chiasm. A pituitary tumour expanding superiorly compresses the central chiasm, interrupting these crossing nasal fibres bilaterally — producing bitemporal hemianopia (loss of both temporal visual fields). Temporal fibres (carrying nasal field) do not cross and are spared in central chiasm compression.	Visual pathway anatomy: nasal fibres cross at the chiasm (temporal field lost); temporal fibres don't cross (nasal field). Central chiasm lesion = bitemporal hemianopia. Lateral chiasm lesion (e.g. aneurysm) = binasal hemianopia. Optic tract lesion = contralateral homonymous hemianopia. Pituitary tumours classically cause bitemporal hemianopia — must-know for anatomy viva.	\N	\N	2026-07-12 17:30:08.367783	f	\N	\N	\N
56	A mountain climber ascends rapidly to 5000m above sea level. On the first day, he feels breathless, dizzy, and has a headache. His arterial blood gases show: PaO₂ 45 mmHg, PaCO₂ 28 mmHg, pH 7.48. Explain the physiological responses occurring and the ABG pattern.	Physiology	At high altitude, low atmospheric PO₂ stimulates peripheral chemoreceptors (carotid bodies) causing hyperventilation, which lowers PaCO₂ (respiratory alkalosis — pH 7.48, low PaCO₂). Over days, renal compensation excretes HCO₃⁻ to normalise pH. The 2,3-DPG increases, shifting the oxygen-haemoglobin curve rightward (Bohr shift) to offload more O₂ to tissues. EPO release stimulates erythropoiesis over weeks, increasing haematocrit.	High altitude acclimatisation is a classic physiology question. Immediate response: hyperventilation via peripheral chemoreceptors. Acute: respiratory alkalosis. Chronic: polycythaemia, increased 2,3-DPG, renal HCO₃⁻ excretion. ABG shows low PaO₂ + low PaCO₂ + high pH acutely. Guyton chapter on high altitude and respiration.	\N	\N	2026-07-12 17:30:09.912451	f	\N	\N	\N
57	A 28-year-old man runs a marathon. During the race, his cardiac output increases from 5 L/min to 25 L/min. His heart rate increases from 70 to 170 bpm. Calculate his stroke volume at rest and during exercise, and explain the mechanisms increasing cardiac output.	Physiology	Rest: CO = HR × SV → 5000 = 70 × SV → SV = 71 mL. Exercise: 25000 = 170 × SV → SV = 147 mL. Mechanisms: (1) Increased HR — sympathetic stimulation, catecholamines; (2) Increased SV — increased venous return (muscle pump, venoconstriction), Frank-Starling mechanism (increased preload → increased SV); (3) Reduced afterload due to vasodilation in exercising muscles; (4) Increased contractility via sympathetic stimulation and catecholamines.	Cardiac output = HR × SV. During exercise, both HR and SV increase. SV increases due to Frank-Starling mechanism (increased EDV) and increased inotropy. The muscle pump and respiratory pump enhance venous return. Blood is redistributed from splanchnic to exercising muscles. These concepts are core to cardiovascular physiology in Guyton & Hall.	\N	\N	2026-07-12 17:30:11.662259	f	\N	\N	\N
58	A 16-year-old girl presents with weakness, constipation, polyuria, and kidney stones. Her blood tests show: calcium 12.5 mg/dL (high), phosphate 1.8 mg/dL (low), PTH markedly elevated. What is the diagnosis? Explain how PTH produces each biochemical abnormality.	Physiology	Primary hyperparathyroidism (parathyroid adenoma). PTH actions: (1) Bone — activates osteoclasts → releases Ca²⁺ and PO₄³⁻ into blood; (2) Kidney — increases Ca²⁺ reabsorption in DCT (hypercalcaemia), decreases PO₄³⁻ reabsorption in PCT (hypophosphataemia, phosphaturia), activates 1α-hydroxylase → increases calcitriol → enhanced gut Ca²⁺ absorption. Clinical: 'Bones, stones, groans, and psychic moans' — bone pain, kidney stones, constipation/nausea, neuropsychiatric symptoms.	PTH is the key regulator of calcium-phosphate balance. It raises serum Ca²⁺ and lowers PO₄³⁻. High Ca²⁺ causes the '4 groans': bones (osteitis fibrosa cystica), stones (nephrolithiasis), groans (abdominal pain/constipation), moans (depression). PTH-calcitriol-calcium axis is a must-know for 1st year physiology.	\N	\N	2026-07-12 17:30:13.409785	f	\N	\N	\N
59	A 22-year-old woman with type 1 diabetes mellitus is brought in unconscious. Her blood glucose is 38 mg/dL, insulin level is very high, and glucagon is low. She was found with empty insulin vials. Describe the counter-regulatory hormonal responses that should normally occur to correct hypoglycaemia.	Physiology	Normal counter-regulatory response to hypoglycaemia: (1) Glucagon (1st responder, from α cells) — stimulates glycogenolysis and gluconeogenesis in the liver, raising blood glucose; (2) Adrenaline (epinephrine) — stimulates glycogenolysis, gluconeogenesis, and inhibits insulin secretion; causes sweating, tachycardia, tremor; (3) Cortisol and GH (later, sustained hypoglycaemia) — promote gluconeogenesis and lipolysis. In this case, exogenous insulin suppresses glucagon and adrenaline responses are overwhelmed.	Glucose counter-regulation follows a hierarchy: glucagon → adrenaline → cortisol → GH. Glucagon is the primary defence against hypoglycaemia. In type 1 DM, glucagon response is blunted. Symptoms of hypoglycaemia: adrenergic (sweating, tremor, palpitations) and neuroglycopenic (confusion, seizure). Core Guyton physiology of glucose regulation.	\N	\N	2026-07-12 17:30:15.103493	f	\N	\N	\N
60	A patient undergoes spirometry. Results: TV = 500 mL, IRV = 3000 mL, ERV = 1100 mL, RV = 1200 mL. Calculate: (a) Vital Capacity, (b) Total Lung Capacity, (c) Functional Residual Capacity, (d) Inspiratory Capacity.	Physiology	(a) VC = IRV + TV + ERV = 3000 + 500 + 1100 = 4600 mL. (b) TLC = VC + RV = 4600 + 1200 = 5800 mL. (c) FRC = ERV + RV = 1100 + 1200 = 2300 mL. (d) IC = TV + IRV = 500 + 3000 = 3500 mL. Note: RV and FRC cannot be measured by spirometry alone — require body plethysmography, helium dilution, or nitrogen washout. Normal FEV₁/FVC ratio is ≥ 70%.	Lung volumes are a must-know: TV (tidal), IRV (inspiratory reserve), ERV (expiratory reserve), RV (residual). Spirometry cannot measure RV. VC = IRV+TV+ERV. TLC = VC+RV. FRC = ERV+RV. IC = TV+IRV. These formulae appear in every MBBS exam. Guyton respiratory chapter.	\N	\N	2026-07-12 17:30:16.681613	f	\N	\N	\N
61	A 50-year-old chronic alcoholic presents with fatigue, macrocytic anaemia, and peripheral neuropathy. His serum folate is normal but B12 is very low. Neurological signs include loss of vibration sense and proprioception in both legs. What is the mechanism of his neurological features?	Physiology	Vitamin B12 (cobalamin) deficiency causes subacute combined degeneration (SCD) of the spinal cord. B12 is essential for myelin synthesis via the methionine synthase and methylmalonyl-CoA mutase pathways. Deficiency leads to accumulation of methylmalonyl-CoA, which disrupts myelin. The posterior columns (vibration, proprioception) and lateral corticospinal tracts are preferentially affected — hence 'combined degeneration'. Peripheral neuropathy is also present. Folate deficiency causes megaloblastic anaemia but NOT neurological disease.	B12 is absorbed in the terminal ileum with intrinsic factor from parietal cells. Alcoholics have malnutrition and gastritis reducing IF. B12 deficiency → subacute combined degeneration (posterior + lateral cord). Folate causes anaemia but spares neurons. This distinction is high-yield for physiology of nerve conduction and haematology.	\N	\N	2026-07-12 17:30:19.570534	f	\N	\N	\N
62	A 19-year-old male athlete is tested for maximum oxygen uptake (VO₂ max). His VO₂ max is 70 mL/kg/min compared to a sedentary person's 35 mL/kg/min. What structural and functional adaptations in his cardiovascular and muscular systems explain this difference?	Physiology	Cardiovascular adaptations: (1) Increased cardiac output (up to 30–40 L/min vs 20–25 L/min in untrained); (2) Athlete's heart — increased ventricular volume (eccentric hypertrophy), increased SV (90–110 mL at rest vs 60–70 mL); (3) Resting bradycardia due to increased vagal tone; (4) Increased capillary density in muscles. Muscular adaptations: (5) Increased mitochondrial density and size; (6) More type I (slow-twitch, oxidative) fibres; (7) Increased myoglobin content; (8) Enhanced activity of oxidative enzymes (citrate synthase, succinate dehydrogenase).	VO₂ max is the gold standard of cardiorespiratory fitness. Fick's equation: VO₂ = CO × (CaO₂ − CvO₂). Training increases both delivery (CO) and extraction (A-V O₂ difference). Athlete's heart has high SV, low resting HR (50–60 bpm). Mitochondrial adaptations improve oxidative capacity. Core exercise physiology.	\N	\N	2026-07-12 17:30:21.094361	f	\N	\N	\N
63	A 2-year-old child is brought with recurrent respiratory infections. Sweat test shows Na⁺ > 60 mEq/L. On PFTs, there is obstructive pattern. Stool shows steatorrhoea. Explain the physiological mechanisms behind each clinical feature.	Physiology	Cystic fibrosis — CFTR (Cl⁻ channel) defect. (1) Sweat: CFTR normally reabsorbs Cl⁻ in sweat ducts; defect → high Na⁺/Cl⁻ in sweat; (2) Lungs: Thick mucus (dehydrated airway surface fluid due to Na⁺ hyperabsorption via ENaC) → mucus plugging → obstructive pattern on PFTs → recurrent infections (Pseudomonas, Staphylococcus); (3) Pancreas: Thick secretions block pancreatic ducts → exocrine deficiency → malabsorption of fats → steatorrhoea, fat-soluble vitamin deficiency. CFTR mutation is autosomal recessive (chromosome 7).	CF is the most common life-limiting autosomal recessive disease in Caucasians. CFTR is a cAMP-regulated Cl⁻ channel. Its absence causes organ-specific effects based on where the channel is expressed. Sweat test >60 mEq/L is diagnostic. Core ion transport physiology applicable to epithelial function.	\N	\N	2026-07-12 17:30:22.568266	f	\N	\N	\N
64	A 65-year-old woman with longstanding hypertension develops progressive leg oedema, dyspnoea, and oliguria. Investigations: serum Na⁺ 130 mEq/L, plasma osmolality 265 mOsm/kg, urine Na⁺ <10 mEq/L, BUN/creatinine = 20:1. Explain the pathophysiology of her oedema and the renal response.	Physiology	Left heart failure → reduced cardiac output → activation of RAAS (low renal perfusion → renin → angiotensin II → aldosterone → Na⁺ and H₂O retention) and ADH release (increased despite low osmolality — 'non-osmotic ADH release' driven by low effective circulatory volume). Result: urine Na⁺ <10 mEq/L (avid Na⁺ retention) and dilutional hyponatraemia. Oedema: Starling forces — increased venous hydrostatic pressure + reduced oncotic pressure (if hypoalbuminaemic) → fluid moves into interstitium. BUN:Cr 20:1 indicates prerenal azotaemia.	Oedema in heart failure involves RAAS + ADH activation, Na⁺/water retention, and altered Starling forces. Urine Na⁺ <20 mEq/L indicates prerenal state (kidney trying to retain Na⁺). Dilutional hyponatraemia occurs due to ADH-mediated free water retention. Starling forces: oncotic pressure (albumin) opposes hydrostatic pressure. High-yield physiology of body fluid compartments.	\N	\N	2026-07-12 17:30:24.177642	f	\N	\N	\N
65	A 55-year-old man with COPD shows: pH 7.32, PaCO₂ 58 mmHg, PaO₂ 52 mmHg, HCO₃⁻ 30 mEq/L. He is given high-flow O₂. His breathing slows down further. Explain why high-flow O₂ can be dangerous in COPD.	Physiology	Chronic respiratory acidosis (pH 7.32, high PaCO₂, compensatory high HCO₃⁻). In chronic COPD, persistently elevated PaCO₂ causes central chemoreceptors to reset ('CO₂ narcosis threshold'). The hypoxic drive from peripheral chemoreceptors (carotid bodies sensing low PaO₂) becomes the primary respiratory stimulus. Giving high-flow O₂ abolishes this hypoxic drive → respiratory depression → further CO₂ retention → worsening respiratory acidosis and CO₂ narcosis. Use controlled O₂ targeting SaO₂ 88–92%.	Normally CO₂ drives breathing via central chemoreceptors. In chronic hypercapnia, central receptors adapt — hypoxia becomes the drive. The 'hypoxic drive' concept is critical for managing COPD. ABG interpretation: respiratory acidosis + high HCO₃⁻ = chronic compensation. Controlled O₂ is the safe approach (target 88–92% SpO₂).	\N	\N	2026-07-12 17:30:27.064505	f	\N	\N	\N
66	A 6-year-old boy presents with progressive muscle weakness, large calves (pseudohypertrophy), and inability to climb stairs. Serum CK is markedly elevated (10,000 IU/L). Muscle biopsy shows absent dystrophin. What is the biochemical basis of his muscle weakness and why are the calves enlarged despite being weak?	Biochemistry	Duchenne Muscular Dystrophy — X-linked recessive mutation in the dystrophin gene (Xp21). Dystrophin links the intracellular actin cytoskeleton to the extracellular matrix via the dystrophin-associated protein complex, maintaining sarcolemmal integrity. Without dystrophin, muscle fibres rupture with contraction → Ca²⁺ influx → muscle fibre necrosis → elevated CK (leaks from damaged fibres). Calves appear large (pseudohypertrophy) due to replacement of necrotic muscle with fat and fibrous connective tissue, not true muscle hypertrophy. CK is the earliest and most sensitive marker.	Dystrophin protects the sarcolemma during muscle contraction. Its absence causes repeated contraction-induced injury. CK rises as it leaks from damaged myocytes. Pseudohypertrophy = fat + fibrosis replacing muscle. DMD is the most severe muscular dystrophy (onset <5 years). Becker MD = less severe, partially functional dystrophin.	\N	\N	2026-07-12 17:30:28.809629	f	\N	\N	\N
67	A 3-month-old exclusively breastfed infant develops jaundice. Serum bilirubin: total 18 mg/dL, direct 0.3 mg/dL. The jaundice worsens instead of resolving. The mother's milk contains pregnanediol. What is the diagnosis and mechanism?	Biochemistry	Breast milk jaundice — caused by a substance (pregnanediol, fatty acids, or β-glucuronidase) in maternal breast milk that inhibits hepatic UDP-glucuronosyltransferase (UGT1A1), the enzyme responsible for bilirubin conjugation. Result: unconjugated hyperbilirubinaemia. Unlike physiological jaundice (resolves by day 10), breast milk jaundice peaks at 2–3 weeks and can persist for months. It is benign. Interrupting breastfeeding for 48 hours causes bilirubin to fall rapidly, confirming the diagnosis.	Bilirubin metabolism: haem → biliverdin → unconjugated bilirubin → conjugated (glucuronide) by UGT1A1 in liver → excreted in bile. Pregnanediol inhibits UGT1A1. Unconjugated bilirubin is indirect, fat-soluble, and can cross the blood-brain barrier (kernicterus risk). Distinguish from breastfeeding jaundice (inadequate intake → dehydration) which occurs earlier.	\N	\N	2026-07-12 17:30:30.443055	f	\N	\N	\N
68	A 25-year-old man of Mediterranean origin develops acute haemolytic anaemia and jaundice 2 days after taking primaquine for malaria. His blood film shows bite cells and Heinz bodies. Explain the biochemical mechanism.	Biochemistry	G6PD (Glucose-6-Phosphate Dehydrogenase) deficiency — X-linked recessive. G6PD is the rate-limiting enzyme of the hexose monophosphate (HMP) shunt, generating NADPH. NADPH reduces glutathione (via glutathione reductase), which protects RBCs from oxidative stress. Without G6PD, primaquine (oxidant) → H₂O₂ accumulates → oxidises haemoglobin → Heinz bodies (denatured Hb precipitates). Macrophages remove Heinz bodies by biting out portions of RBC membrane → bite cells. Fragile RBCs haemolyse → anaemia and jaundice (unconjugated hyperbilirubinaemia).	G6PD deficiency is the most common enzyme disorder worldwide. HMP shunt → NADPH → reduced glutathione → antioxidant protection. Triggers: primaquine, dapsone, infections, fava beans. Blood film: Heinz bodies (supravital stain) and bite cells. G6PD assay is diagnostic (done after acute episode resolves as enzyme is destroyed in old RBCs).	\N	\N	2026-07-12 17:30:31.873376	f	\N	\N	\N
69	A 45-year-old man on long-term isoniazid (INH) therapy for tuberculosis develops peripheral neuropathy with burning feet and dermatitis around the mouth. His diet is adequate. Explain the biochemical mechanism of his neuropathy.	Biochemistry	INH inhibits pyridoxal kinase, reducing the conversion of pyridoxine (vitamin B6) to its active form, pyridoxal phosphate (PLP). PLP is a coenzyme for over 100 reactions including: (1) transamination (ALT, AST), (2) decarboxylation of amino acids (GABA, serotonin, dopamine synthesis), (3) δ-aminolaevulinic acid synthase (haem synthesis), and (4) glycogenolysis. Deficiency → reduced GABA and serotonin → peripheral neuropathy. Treatment: pyridoxine supplementation (25 mg/day) given prophylactically with INH.	PLP (active B6) is a key coenzyme. INH-induced B6 deficiency is a preventable cause of neuropathy. PLP-dependent reactions: transaminases (GOT, GPT), amino acid decarboxylases (DOPA → dopamine), sphingomyelin synthesis, glycogen phosphorylase. Classic triad of B6 deficiency: dermatitis (seborrhoeic), glossitis, peripheral neuropathy.	\N	\N	2026-07-12 17:30:33.54751	f	\N	\N	\N
70	A 50-year-old obese man is found to have fasting blood glucose of 135 mg/dL on two occasions. His HbA1c is 8.2%. His doctor says his insulin is actually higher than normal. Explain the biochemical basis of his condition and why high insulin still fails to lower glucose.	Biochemistry	Type 2 Diabetes Mellitus with insulin resistance. Pathophysiology: obesity causes excess free fatty acids and adipokines (especially reduced adiponectin, increased TNF-α and IL-6) → intracellular diacylglycerol and ceramide accumulate → activate PKC → serine phosphorylation of IRS-1 (instead of normal tyrosine) → impaired PI3K/Akt signalling → reduced GLUT-4 translocation to cell membrane in muscle and adipose tissue → reduced glucose uptake. HbA1c 8.2% reflects average blood glucose over 2–3 months (chronically elevated).	Insulin resistance = impaired insulin signalling. Normal pathway: insulin → IR tyrosine kinase → IRS-1 Tyr phosphorylation → PI3K → Akt → GLUT-4 vesicle fusion. Resistance: serine phosphorylation blocks the cascade. HbA1c: glucose attaches non-enzymatically to Hb — reflects 3-month average. GLUT-4 is the insulin-sensitive transporter in muscle/fat; GLUT-2 in liver/pancreas is insulin-independent.	\N	\N	2026-07-12 17:30:34.992646	f	\N	\N	\N
71	A 3-year-old child has recurrent hypoglycaemia after fasting for >6 hours. His blood shows: low glucose, low insulin, elevated free fatty acids but paradoxically low ketones. Liver biopsy shows lipid accumulation. What enzyme defect does this suggest?	Biochemistry	MCAD (Medium-Chain Acyl-CoA Dehydrogenase) deficiency — the most common fatty acid oxidation disorder. Normally, fasting triggers lipolysis → free fatty acids enter mitochondria via carnitine shuttle → β-oxidation → acetyl-CoA → ketone bodies (β-hydroxybutyrate, acetoacetate). MCAD deficiency blocks β-oxidation of medium-chain (C6–C12) fatty acids → acetyl-CoA is not generated → ketogenesis fails (hypoketotic) → brain is deprived of both glucose and ketones → severe hypoglycaemia. Fatty acids accumulate in liver (steatosis). Can be fatal if unrecognised during intercurrent illness.	β-oxidation generates NADH, FADH₂, and acetyl-CoA. In fasting, ketone bodies from acetyl-CoA (HMG-CoA pathway in liver) fuel the brain. MCAD deficiency = no ketones despite high FFA — the key diagnostic clue. Hypoketotic hypoglycaemia distinguishes fatty acid oxidation defects from other hypoglycaemia causes. MCAD is screened on newborn screening (acylcarnitine profile).	\N	\N	2026-07-12 17:30:36.575874	f	\N	\N	\N
72	A patient with liver cirrhosis and portal hypertension presents with confusion, asterixis (flapping tremor), and foetid breath (fetor hepaticus). His serum ammonia is markedly elevated. Explain the normal pathway for ammonia detoxification and why it fails in liver disease.	Biochemistry	Ammonia (NH₃) is produced from: (1) amino acid deamination (glutamate dehydrogenase in liver), (2) bacterial action in the colon on proteins, (3) purine nucleotide cycle in muscle. Normally, the urea cycle in periportal hepatocytes detoxifies NH₃: NH₃ + CO₂ → carbamoyl phosphate → citrulline → argininosuccinate → arginine → urea + ornithine. In cirrhosis, hepatocyte mass is reduced and portal blood bypasses the liver (shunting) → NH₃ enters systemic circulation → crosses BBB → NH₄⁺ interferes with neuronal glutamate receptors and the TCA cycle in astrocytes → hepatic encephalopathy.	The urea cycle is exclusively in the liver (periportal zone). Rate-limiting enzyme: carbamoyl phosphate synthetase I (CPS-I), activated by N-acetylglutamate. In liver failure, shunting bypasses hepatocytes. NH₃ is toxic: inhibits α-KG (TCA cycle), causes astrocyte swelling (glutamine osmotic effects). Treatment: lactulose (traps NH₃ as NH₄⁺ in colon), rifaximin, low-protein diet.	\N	\N	2026-07-12 17:30:38.142117	f	\N	\N	\N
73	A 60-year-old man on a statin for high cholesterol develops muscle pain and dark urine. His CK is 50,000 IU/L. His urine myoglobin is positive. Explain the biochemical action of statins and the mechanism of this complication.	Biochemistry	Statins (HMG-CoA reductase inhibitors) block the conversion of HMG-CoA to mevalonate — the rate-limiting step in cholesterol synthesis in the liver. This upregulates hepatic LDL receptors (SREBP pathway) → increased LDL clearance from blood. The mevalonate pathway also produces farnesyl pyrophosphate and geranylgeranyl pyrophosphate — used to prenylate (lipid-modify) small GTPases (Ras, Rho, Rac) essential for mitochondrial function in muscle. Statin-induced depletion of these intermediates → mitochondrial dysfunction in skeletal muscle → rhabdomyolysis → myoglobinuria → acute kidney injury (myoglobin is nephrotoxic, especially in acidic urine).	HMG-CoA reductase is the key enzyme of cholesterol synthesis (step 3 of mevalonate pathway). Statins are competitive inhibitors. Side effect: myopathy (mild) → rhabdomyolysis (rare, severe, CK >10× normal). Risk increased with: high dose, concurrent fibrates/CYP3A4 inhibitors. Myoglobin = muscle Hb; turns urine brown. AKI from myoglobin: treat with IV fluids + alkalinisation.	\N	\N	2026-07-12 17:30:40.432287	f	\N	\N	\N
74	A 30-year-old woman with phenylketonuria (PKU) who was asymptomatic on a low-phenylalanine diet becomes pregnant. Despite having near-normal phenylalanine levels, her baby is born with microcephaly, intellectual disability, and congenital heart disease. Explain the mechanism.	Biochemistry	Maternal PKU — the mother's elevated phenylalanine (even if controlled by diet during non-pregnant life) crosses the placenta. During pregnancy, even mildly elevated maternal phenylalanine is teratogenic to the fetus (fetal brain is more sensitive). Phenylalanine competes with other large neutral amino acids for transport across the blood-brain barrier (LAT1 transporter). High phenylalanine → reduced brain uptake of tyrosine, tryptophan → reduced dopamine, serotonin, noradrenaline → impaired neurodevelopment. The fetus does not have PKU but is harmed by maternal phenylalanine. Very strict dietary control must begin BEFORE conception.	PKU: Phenylalanine hydroxylase deficiency → Phe accumulates → phenylpyruvate (musty odour). Classic PKU screened on day 3 (Guthrie test). Maternal PKU is a different scenario — the embryo/fetus is damaged by maternal phenylalanine even if the fetus is heterozygous. Phe crosses placenta. Diet control before and throughout pregnancy is essential.	\N	\N	2026-07-12 17:30:41.97994	f	\N	\N	\N
75	A child presents with progressive neurological deterioration, cherry-red spot on fundus examination, hepatosplenomegaly, and foamy histiocytes on bone marrow biopsy. Enzyme assay shows absent hexosaminidase A. What is the diagnosis and biochemical mechanism?	Biochemistry	Niemann-Pick disease if considering hepatosplenomegaly + foamy cells, but the absent hexosaminidase A and cherry-red spot specifically indicate Tay-Sachs disease (GM2 gangliosidosis) in the neurological form, or Sandhoff disease. However, with hepatosplenomegaly + foamy cells + cherry-red spot, this better describes Niemann-Pick Type A (sphingomyelinase deficiency → sphingomyelin accumulation) or Tay-Sachs variant. Most precisely: absent Hex-A → Tay-Sachs (GM2 ganglioside accumulates in neurons). Cherry-red spot: normal retinal fovea surrounded by lipid-laden ganglion cells appearing white. Foamy histiocytes suggest a storage disorder — in Tay-Sachs these are largely neuronal.	Lysosomal storage diseases: enzyme deficiency → substrate accumulates. Tay-Sachs: Hex-A deficiency → GM2 ganglioside in neurons. Cherry-red spot: the fovea (no ganglion cells) appears red against the surrounding pale lipid-laden cells. No hepatosplenomegaly in classic Tay-Sachs (vs Niemann-Pick which has sphingomyelinase deficiency → sphingomyelin in liver/spleen). Autosomal recessive. Ashkenazi Jewish population. Harper's Biochemistry.	\N	\N	2026-07-12 17:30:43.733501	f	\N	\N	\N
\.


--
-- Data for Name: community_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_groups (id, name, subject, member_count, last_message, last_message_time, created_at, description, created_by, is_admin_created, cohort_year, cohort_session_year) FROM stdin;
4	Test Study Group 1781680050068	Anatomy	1	\N	\N	2026-06-17 07:10:37.026947	Test group for QA	24	f	\N	\N
5	Legends	Physiology	1	\N	\N	2026-06-28 09:28:48.146069	\N	19	f	\N	\N
\.


--
-- Data for Name: community_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_messages (id, group_id, sender_name, sender_avatar_url, content, created_at, sender_id, file_url, file_type, file_name, message_type, rich_content, is_edited, edited_at, deleted_for_everyone, deleted_by, seen_by) FROM stdin;
1	4	Community Tester	\N	Hello from QA test	2026-06-17 07:11:01.750332	24	\N	\N	\N	text	\N	f	\N	f	[]	[]
\.


--
-- Data for Name: community_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_posts (id, title, content, author, author_avatar_url, group_name, like_count, reply_count, created_at, author_id, media_url, media_type, cohort_year, cohort_session_year) FROM stdin;
\.


--
-- Data for Name: confession_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.confession_likes (id, user_id, confession_id, created_at) FROM stdin;
1	19	1	2026-06-20 12:52:44.142076
\.


--
-- Data for Name: confessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.confessions (id, user_id, content, likes, created_at, cohort_year, cohort_session_year) FROM stdin;
1	28	I stayed up all night studying anatomy and still got the attachment of flexor digitorum wrong 💀	1	2026-06-19 15:01:10.325376	\N	\N
\.


--
-- Data for Name: content_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_reports (id, reporter_id, content_type, content_id, content_preview, reason, status, reviewed_by, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: daily_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_questions (id, user_id, date_key, subject, question_json, answered, was_correct, created_at) FROM stdin;
1	44	2026-07-04	Anatomy	{"text": "Which of the following arteries is primarily responsible for the blood supply to the spleen?", "options": ["A. Renal artery", "B. Celiac trunk", "C. Superior mesenteric artery", "D. Inferior mesenteric artery"], "explanation": "The spleen receives its blood supply mainly from the splenic artery, which is a branch of the celiac trunk. The celiac trunk is responsible for providing blood to the abdominal organs, including the spleen.", "correctOption": 1}	t	f	2026-07-04 19:59:05.688753
2	45	2026-07-04	Anatomy	{"text": "Which of the following structures is NOT a part of the axial skeleton?", "options": ["Skull", "Vertebral column", "Ribs", "Clavicle"], "explanation": "The axial skeleton consists of the skull, vertebral column, and ribs. The clavicle is part of the appendicular skeleton, which includes the bones of the limbs and the girdles that attach them to the axial skeleton.", "correctOption": 3}	t	f	2026-07-04 20:02:51.915427
3	46	2026-07-04	Anatomy	{"text": "Which of the following arteries is the primary source of blood supply to the diaphysis of long bones?", "options": ["A. Nutrient artery", "B. Metaphyseal artery", "C. Epiphyseal artery", "D. Periosteal artery"], "explanation": "The nutrient artery is the primary blood supply to the diaphysis of long bones. It enters through a nutrient foramen and supplies the medullary cavity and inner layers of the cortex, while other arteries primarily supply the metaphysis and epiphysis.", "correctOption": 0}	t	t	2026-07-04 20:11:50.219884
4	47	2026-07-04	Anatomy	{"text": "Which of the following structures is primarily responsible for the production of cerebrospinal fluid (CSF) in the brain?", "options": ["A. Choroid plexus", "B. Arachnoid mater", "C. Ependymal cells", "D. Cerebral cortex"], "explanation": "The choroid plexus, located in the ventricles of the brain, is the main structure responsible for producing cerebrospinal fluid (CSF). It consists of a network of blood vessels surrounded by specialized ependymal cells that filter blood to create CSF.", "correctOption": 0}	f	\N	2026-07-04 20:18:44.569822
5	48	2026-07-04	Anatomy	{"text": "Which of the following structures is NOT part of the brachial plexus?", "options": ["Musculocutaneous nerve", "Median nerve", "Ulnar nerve", "Intercostal nerve"], "explanation": "The intercostal nerves are not part of the brachial plexus; they arise from the thoracic spinal nerves and supply the muscles and skin of the thoracic wall.", "correctOption": 3}	t	f	2026-07-04 20:22:59.908498
6	19	2026-07-04	Anatomy	{"text": "Which of the following structures is NOT part of the anterior triangle of the neck?", "options": ["Carotid artery", "External jugular vein", "Thyroid gland", "Submandibular gland"], "explanation": "The external jugular vein is primarily located in the posterior triangle of the neck, while the carotid artery, thyroid gland, and submandibular gland are all structures found in the anterior triangle.", "correctOption": 1}	f	\N	2026-07-04 21:23:20.07153
7	52	2026-07-05	Anatomy	{"text": "Which of the following structures is a key landmark for the surgical approach to the femoral canal?", "options": ["Inguinal ligament", "Sartorius muscle", "Adductor longus muscle", "Pectineus muscle"], "explanation": "The inguinal ligament serves as a key landmark for the femoral canal, which is located below this ligament. It helps in the identification of the femoral sheath and the contents within it during surgical procedures.", "correctOption": 0}	f	\N	2026-07-05 08:36:35.039617
8	53	2026-07-05	Anatomy	{"text": "Which of the following structures separates the anterior and posterior compartments of the forearm?", "options": ["A) Flexor retinaculum", "B) Interosseous membrane", "C) Extensor retinaculum", "D) Antebrachial fascia"], "explanation": "The interosseous membrane is a fibrous connective tissue that lies between the radius and ulna in the forearm, separating the anterior (flexor) compartment from the posterior (extensor) compartment.", "correctOption": 1}	f	\N	2026-07-05 08:52:01.27805
9	19	2026-07-05	Anatomy	{"text": "Which of the following structures is NOT part of the anterior triangle of the neck?", "options": ["Hyoid bone", "Sternocleidomastoid muscle", "Thyroid cartilage", "Scalenus anterior muscle"], "explanation": "The anterior triangle of the neck is bounded by the midline of the neck, the mandible, and the sternocleidomastoid muscle. The scalenus anterior muscle is located in the posterior triangle of the neck, not the anterior triangle.", "correctOption": 3}	f	\N	2026-07-05 09:09:04.806542
10	54	2026-07-05	Anatomy	{"text": "Which of the following structures is NOT directly associated with the brachial plexus?", "options": ["Median nerve", "Ulnar nerve", "Radial nerve", "Femoral nerve"], "explanation": "The femoral nerve is part of the lumbar plexus, not the brachial plexus. The median, ulnar, and radial nerves all originate from the brachial plexus.", "correctOption": 3}	f	\N	2026-07-05 09:43:31.080692
11	55	2026-07-05	Anatomy	{"text": "Which of the following structures is NOT part of the branchial apparatus during embryonic development?", "options": ["First branchial arch", "Second branchial arch", "Facial nerve", "Scapula"], "explanation": "The branchial apparatus consists of the branchial arches, clefts, and pouches that contribute to the development of head and neck structures. The scapula is not a component of the branchial apparatus; it is a bone of the shoulder girdle. The first and second branchial arches and the facial nerve are integral to embryonic development.", "correctOption": 3}	f	\N	2026-07-05 09:49:18.41765
12	56	2026-07-05	Anatomy	{"text": "Which structure serves as the primary connection between the brain and the spinal cord?", "options": ["A. Medulla oblongata", "B. Cerebellum", "C. Pons", "D. Diencephalon"], "explanation": "The medulla oblongata is the most inferior part of the brainstem and serves as the primary connection between the brain and the spinal cord. It controls vital autonomic functions such as heart rate and respiration.", "correctOption": 0}	f	\N	2026-07-05 10:09:34.683004
13	63	2026-07-05	Anatomy	{"text": "Which of the following structures is primarily responsible for the production of cerebrospinal fluid (CSF) in the brain?", "options": ["Arachnoid granulations", "Choroid plexus", "Subarachnoid space", "Cerebral aqueduct"], "explanation": "The choroid plexus is the structure located in the ventricles of the brain that produces cerebrospinal fluid (CSF). Arachnoid granulations are involved in the reabsorption of CSF, the subarachnoid space is the area where CSF circulates, and the cerebral aqueduct is a channel through which CSF flows.", "correctOption": 1}	f	\N	2026-07-05 11:24:48.870453
14	64	2026-07-05	Anatomy	{"text": "Which of the following structures is primarily responsible for the anterior projection of the diaphragm's central tendon?", "options": ["A. Sternal part of diaphragm", "B. Costal part of diaphragm", "C. Lumbar part of diaphragm", "D. Central tendon only"], "explanation": "The anterior projection of the central tendon of the diaphragm is primarily influenced by the sternal part of the diaphragm, which attaches to the xiphoid process and contributes to the downward movement of the diaphragm during inhalation.", "correctOption": 0}	f	\N	2026-07-05 19:59:22.472768
15	19	2026-07-06	Anatomy	{"text": "Which of the following structures is primarily responsible for the blood supply to the liver?", "options": ["A. Inferior mesenteric artery", "B. Celiac trunk", "C. Renal artery", "D. Femoral artery"], "explanation": "The liver receives its blood supply from two sources: the hepatic artery (which arises from the celiac trunk) and the portal vein. The celiac trunk is the major artery that supplies the liver, making option B the correct choice.", "correctOption": 1}	t	t	2026-07-06 03:47:00.538905
16	53	2026-07-06	Anatomy	{"text": "Which of the following structures is NOT a content of the carpal tunnel?", "options": ["Median nerve", "Flexor digitorum superficialis tendons", "Flexor pollicis longus tendon", "Flexor carpi radialis tendon"], "explanation": "The carpal tunnel contains the median nerve and the tendons of the flexor digitorum superficialis and flexor pollicis longus muscles. The flexor carpi radialis tendon is located in a separate compartment and does not pass through the carpal tunnel.", "correctOption": 3}	f	\N	2026-07-06 06:50:36.462384
17	6	2026-07-06	Anatomy	{"text": "Which of the following structures is NOT part of the anatomical boundaries of the femoral canal?", "options": ["Medial border: Adductor longus", "Lateral border: Femoral vein", "Anterior border: Inguinal ligament", "Posterior border: Pectineus muscle"], "explanation": "The femoral canal is bounded medially by the lacunar ligament and the medial border is actually constituted by the femoral sheath, which is formed by the iliopsoas muscle and surrounding fascia, rather than the adductor longus. The correct medial reference in femoral anatomy is the femoral vein (lateral), inguinal ligament (anterior), and the pectineus muscle serves as a posterior border.", "correctOption": 0}	f	\N	2026-07-06 16:32:45.290047
18	19	2026-07-07	Anatomy	{"text": "Which of the following structures is NOT part of the anatomy of the forearm?", "options": ["Radius", "Ulna", "Humerus", "Interosseous membrane"], "explanation": "The humerus is the bone of the upper arm, while the radius and ulna are the two long bones in the forearm, and the interosseous membrane connects the radius and ulna.", "correctOption": 2}	f	\N	2026-07-07 05:31:19.825234
19	72	2026-07-07	Anatomy	{"text": "Which of the following structures is primarily supplied by the inferior mesenteric artery?", "options": ["Cecum", "Descending colon", "Transverse colon", "Jejunum"], "explanation": "The inferior mesenteric artery primarily supplies the left colic artery, which in turn supplies the descending colon, sigmoid colon, and the upper part of the rectum. The cecum and transverse colon are supplied by the superior mesenteric artery.", "correctOption": 1}	f	\N	2026-07-07 15:22:22.795179
20	19	2026-07-08	Anatomy	{"text": "Which of the following structures is NOT part of the anterior triangle of the neck?", "options": ["Sternocleidomastoid muscle", "Digastric muscle", "Thyroid gland", "Brachiocephalic vein"], "explanation": "The anterior triangle of the neck is bounded by the midline of the neck, the mandible, and the sternocleidomastoid muscle. Structures within this triangle include the carotid sheath, thyroid gland, and digastric muscle. The brachiocephalic vein is located in the inferior part of the neck and is not considered part of the anterior triangle.", "correctOption": 3}	f	\N	2026-07-08 09:10:41.223233
21	72	2026-07-08	Anatomy	{"text": "Which structure is NOT a part of the brachial plexus?", "options": ["Median nerve", "Ulnar nerve", "Radial nerve", "Femoral nerve"], "explanation": "The brachial plexus is a network of nerves that originates from the spinal nerves C5 to T1 and innervates the shoulder, arm, and hand. The median, ulnar, and radial nerves are all branches of the brachial plexus. The femoral nerve, however, is part of the lumbar plexus and innervates the anterior compartment of the thigh.", "correctOption": 3}	f	\N	2026-07-08 09:28:14.751584
22	19	2026-07-11	Anatomy	{"text": "Which structure is primarily responsible for the motor innervation of the muscles of facial expression?", "options": ["A. Trigeminal nerve (CN V)", "B. Facial nerve (CN VII)", "C. Glossopharyngeal nerve (CN IX)", "D. Accessory nerve (CN XI)"], "explanation": "The facial nerve (CN VII) is responsible for the motor innervation of the muscles of facial expression, allowing for movements such as smiling and frowning.", "correctOption": 1}	t	f	2026-07-11 09:36:39.242471
23	19	2026-07-12	Anatomy	{"text": "Which of the following structures is NOT part of the male reproductive system?", "options": ["Testes", "Prostate gland", "Ovary", "Seminal vesicles"], "explanation": "The ovary is a female reproductive organ responsible for the production of eggs and hormones like estrogen and progesterone. In contrast, the testes, prostate gland, and seminal vesicles are all components of the male reproductive system.", "correctOption": 2}	f	\N	2026-07-12 06:07:23.402603
24	19	2026-07-15	Anatomy	{"text": "Which of the following structures is NOT considered part of the gastrointestinal tract?", "options": ["A) Esophagus", "B) Stomach", "C) Pancreas", "D) Large intestine"], "explanation": "The gastrointestinal tract is defined as the continuous tube from the mouth to the anus, including organs such as the esophagus, stomach, and intestines. The pancreas, while important for digestion, is classified as an accessory organ and is not part of the gastrointestinal tract itself.", "correctOption": 2}	f	\N	2026-07-15 07:07:21.62788
\.


--
-- Data for Name: device_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_events (id, user_id, type, platform, user_agent, created_at) FROM stdin;
6	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-01 09:13:33.382865
7	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-01 09:13:33.866314
8	33	login	other	undici	2026-07-01 10:25:07.456804
9	33	login	other	undici	2026-07-01 10:25:32.601841
10	6	login	other	curl/8.14.1	2026-07-01 13:39:25.724673
11	34	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-01 13:48:43.903958
12	34	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-01 13:50:53.678186
13	34	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-01 13:51:16.766482
14	34	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-01 13:51:39.247015
15	35	login	other	curl/8.14.1	2026-07-01 14:37:38.908282
16	36	login	other	curl/8.14.1	2026-07-01 15:14:20.938506
17	37	login	other	curl/8.14.1	2026-07-04 19:07:49.625073
18	38	login	other	curl/8.14.1	2026-07-04 19:12:41.959314
19	39	login	other	curl/8.14.1	2026-07-04 19:16:55.895616
20	40	login	other	curl/8.14.1	2026-07-04 19:24:45.892587
21	41	login	other	curl/8.14.1	2026-07-04 19:24:46.230654
22	42	login	other	curl/8.14.1	2026-07-04 19:25:19.626236
23	43	login	other	curl/8.14.1	2026-07-04 19:25:20.933878
24	43	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 19:26:51.30754
25	43	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 19:28:38.055739
26	44	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 19:59:02.406301
27	45	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 20:02:48.503498
28	46	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 20:11:46.892301
29	47	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 20:18:41.171744
30	48	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 20:22:56.881953
31	49	login	other	curl/8.14.1	2026-07-04 21:22:21.251999
32	6	login	other	undici	2026-07-04 22:02:07.860264
33	19	login	other	undici	2026-07-04 22:02:08.154324
34	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-04 22:10:24.668971
35	6	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 08:05:56.530904
36	6	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 08:06:55.412536
37	6	login	other	undici	2026-07-05 08:12:28.671841
38	6	login	other	curl/8.14.1	2026-07-05 08:21:26.464101
39	6	login	other	curl/8.14.1	2026-07-05 08:23:43.586054
40	6	login	other	curl/8.14.1	2026-07-05 08:25:09.707942
41	50	login	other	curl/8.14.1	2026-07-05 08:28:24.773115
42	50	login	other	curl/8.14.1	2026-07-05 08:28:49.74996
43	50	login	other	curl/8.14.1	2026-07-05 08:29:10.163646
44	6	login	other	curl/8.14.1	2026-07-05 08:29:29.857662
45	51	login	other	curl/8.14.1	2026-07-05 08:32:21.274268
46	52	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 08:33:54.986046
47	52	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 08:36:31.716181
48	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 08:51:57.659985
49	6	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-05 09:20:45.066469
50	54	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 09:43:27.926437
51	55	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 09:49:14.796904
52	55	login	other	curl/8.14.1	2026-07-05 09:52:38.506519
53	56	login	other	curl/8.14.1	2026-07-05 10:06:33.900558
54	57	login	other	curl/8.14.1	2026-07-05 10:13:41.890591
55	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-05 10:16:48.255603
56	58	login	other	curl/8.14.1	2026-07-05 10:18:13.857759
57	59	login	other	curl/8.14.1	2026-07-05 10:22:14.727993
58	60	login	other	curl/8.14.1	2026-07-05 10:25:24.426995
59	61	login	other	curl/8.14.1	2026-07-05 10:32:08.17522
60	62	login	other	curl/8.14.1	2026-07-05 10:51:51.159075
61	6	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-05 10:59:48.424434
62	63	login	other	curl/8.14.1	2026-07-05 11:23:24.094573
63	63	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 11:24:44.912606
64	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-05 11:28:42.96131
65	6	login	other	curl/8.14.1	2026-07-05 17:19:09.80037
66	6	login	other	curl/8.14.1	2026-07-05 17:29:05.986863
67	6	login	other	curl/8.14.1	2026-07-05 17:34:39.177755
68	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 18:04:02.29186
69	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 18:06:09.697412
70	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-05 18:08:23.141798
71	6	login	other	curl/8.14.1	2026-07-05 18:19:53.588921
72	6	login	other	curl/8.14.1	2026-07-05 19:08:10.338566
73	6	login	other	curl/8.14.1	2026-07-05 19:08:17.920764
74	6	login	other	curl/8.14.1	2026-07-05 19:08:28.189339
75	6	login	other	curl/8.14.1	2026-07-05 19:08:48.007596
76	6	login	other	curl/8.14.1	2026-07-05 19:09:06.696777
77	6	login	other	curl/8.14.1	2026-07-05 19:09:22.210258
78	6	login	other	curl/8.14.1	2026-07-05 19:52:32.046087
79	64	login	other	curl/8.14.1	2026-07-05 19:58:29.957301
80	6	login	other	curl/8.14.1	2026-07-05 20:05:37.69806
81	65	login	other	curl/8.14.1	2026-07-06 04:48:11.375987
82	19	login	other	undici	2026-07-06 04:51:43.525105
83	19	login	other	undici	2026-07-06 04:51:51.224682
84	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 06:32:23.101392
85	19	login	other	curl/8.14.1	2026-07-06 06:37:09.097878
86	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 06:39:22.255136
87	19	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 06:42:27.469794
88	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 06:50:32.295053
89	53	login	other	curl/8.14.1	2026-07-06 07:04:35.805073
90	53	login	other	curl/8.14.1	2026-07-06 07:07:32.494863
91	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 07:17:37.24766
92	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 07:20:58.957154
93	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 07:29:39.799422
94	53	login	other	curl/8.14.1	2026-07-06 07:34:44.010601
95	53	login	other	curl/8.14.1	2026-07-06 07:46:50.492542
96	53	login	other	curl/8.14.1	2026-07-06 07:47:12.716059
97	53	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 07:50:59.54596
98	53	login	other	curl/8.14.1	2026-07-06 10:10:27.477697
99	53	login	other	curl/8.14.1	2026-07-06 10:17:09.881444
100	53	login	other	curl/8.14.1	2026-07-06 10:17:10.058904
101	53	login	other	curl/8.14.1	2026-07-06 10:19:36.977255
102	6	login	other	undici	2026-07-06 13:48:56.862968
103	6	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-06 16:32:27.871356
104	66	login	other	curl/8.14.1	2026-07-06 17:14:37.082587
105	67	login	other	curl/8.14.1	2026-07-06 17:24:19.400484
106	68	login	other	curl/8.14.1	2026-07-06 17:35:19.459799
107	69	login	other	curl/8.14.1	2026-07-06 18:27:00.434135
108	70	login	other	curl/8.14.1	2026-07-06 20:24:34.563461
109	71	login	other	undici	2026-07-06 20:35:26.827488
110	6	login	other	curl/8.14.1	2026-07-07 11:58:50.497176
111	72	login	other	curl/8.14.1	2026-07-07 15:20:46.063573
112	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-07 15:22:17.480779
113	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-07 15:24:36.130949
114	72	login	other	curl/8.14.1	2026-07-07 15:28:43.14636
115	72	login	other	curl/8.14.1	2026-07-07 15:29:01.255081
116	72	login	other	curl/8.14.1	2026-07-07 15:29:23.646913
117	72	login	other	curl/8.14.1	2026-07-07 15:29:26.524188
118	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 09:28:10.939038
119	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 09:29:54.52298
120	72	login	other	curl/8.14.1	2026-07-08 09:31:22.808997
121	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-08 17:02:12.336911
122	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 17:17:18.263892
123	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 17:17:34.108715
124	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 17:21:51.22495
125	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-08 17:24:26.192482
126	6	login	other	curl/8.14.1	2026-07-08 17:33:14.146617
127	72	login	other	curl/8.14.1	2026-07-11 09:22:39.144333
128	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-11 09:25:30.920267
129	72	login	desktop	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-07-11 09:30:20.290582
130	72	login	other	curl/8.14.1	2026-07-11 09:32:55.239205
131	72	login	other	curl/8.14.1	2026-07-11 09:32:58.681482
132	72	login	other	curl/8.14.1	2026-07-11 09:33:12.028419
133	72	login	other	curl/8.14.1	2026-07-11 09:33:15.858526
134	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-15 08:04:26.839918
135	19	login	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-15 09:51:59.058208
\.


--
-- Data for Name: doubt_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doubt_answers (id, doubt_id, user_id, author_name, answer, is_accepted, created_at, helpful_count, is_ai_generated) FROM stdin;
1	2	0	Mission AI	In the context of physiology, the term **test cohort isolation** typically refers to the practice of separating a specific group of subjects for the purpose of research or clinical trials. This can involve isolating a cohort based on certain characteristics, such as age, health status, or specific physiological parameters.\n\nRegarding your question about whether this doubt stays isolated to **2026-27**, it seems you may be referring to a specific study or clinical trial timeline. In general, the isolation of a test cohort is not limited to a specific time frame unless the study protocol dictates so. \n\nKey points to consider:\n\n- **Cohort Isolation**: This can be temporary or permanent based on the study design.\n- **Study Duration**: Trials may have defined start and end dates, but the principles of cohort isolation can apply beyond those dates.\n- **Longitudinal Studies**: Some studies may follow cohorts over several years, extending beyond the initial isolation period.\n\nIf you are referring to a specific study or guideline that mentions a time frame, it would be best to consult that document for clarity.\n\nAlways cross-verify with your textbook and batch seniors.	f	2026-07-08 09:45:22.945579	0	t
\.


--
-- Data for Name: doubts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doubts (id, user_id, author_name, subject, title, question, answer_count, resolved, created_at, cohort_year, cohort_session_year) FROM stdin;
1	28	Test Student QA	Anatomy	What is the nerve supply of brachioradialis?	Please explain the nerve supply	0	f	2026-06-19 15:02:59.980976	\N	\N
\.


--
-- Data for Name: email_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_tokens (id, user_id, email, token, type, expires_at, used, created_at) FROM stdin;
3	6	missiondistinction108@gmail.com	29cd1c77134a6f3282e393425c061032cec47b397f3868b6c48af193cfc75e69	reset	2026-06-14 12:13:47.742	f	2026-06-14 11:13:47.743411
13	19	www.jyotirmay1234@gmail.com	d6ca76716b637a564525344fab0c7e4079c5db2bb9118d822c685bee83e97604	verify	2026-06-18 03:38:04.096	f	2026-06-17 03:38:04.097414
14	20	dbfactifier@gmail.com	35f4f4a5a7d7a4305305b6af4d122c1870ce70c736874bad97acad3782544ead	verify	2026-06-18 03:40:12.064	f	2026-06-17 03:40:12.06518
24	30	audit_7vsnzt@test.com	6050e19912ef71e3ec9aa356855688d8753936bc01384eada6c7a8fb5ac8b64d	verify	2026-06-29 15:29:30.786	f	2026-06-28 15:29:30.787567
25	32	devtest_student_1782894828@example.com	adb3c080c5bc049e22c94da2cb58cb458b42321642cddff382f6f89660848cac	verify	2026-07-02 08:33:49.176	f	2026-07-01 08:33:49.177291
26	40	meddy_test_1783193072@test.com	a1f5ac8bc8f0af4d71dab3fde5e25736852f1700f1dae801a98e8072977e9dc7	verify	2026-07-05 19:24:44.769	f	2026-07-04 19:24:44.77046
27	43	meddy_ui_student_1783193119@test.com	e298ad665f609c2d78e086ccdb2aead44433fa078995bfb3903aaa00366c8538	verify	2026-07-05 19:25:19.904	f	2026-07-04 19:25:19.905052
28	44	qa-test-kwzam5@example.com	ef34cda8a341460b7ccb9cfd41abdcc5e5c169e1e70c2a0a9835ebbda4ec872c	verify	2026-07-05 19:59:01.34	f	2026-07-04 19:59:01.340764
29	45	qa-test-rjhqgikg@example.com	b9fe0514e00e2616c6f5d2374d90900e0ec248b993c372fab69da52776428913	verify	2026-07-05 20:02:47.937	f	2026-07-04 20:02:47.93849
30	46	teststudentqa2_1783195831384@example.com	6f56d615fc83a88f7b11b74d73b119a8b5bafab7b19d4434e0cad432c599d840	verify	2026-07-05 20:11:45.784	f	2026-07-04 20:11:45.784863
31	47	qa.tester.1783196252752@example.com	af3d1859302cc3b44156ecf6b38128e9981fc48e0f6a96f7bdb52dff4e5782a8	verify	2026-07-05 20:18:40.412	f	2026-07-04 20:18:40.413058
32	48	qa.tester.two.2q7sxd@example.com	2c59436a6e268b9a4648ab42787d08db3488b7862909337be866a93dc3277f97	verify	2026-07-05 20:22:56.02	f	2026-07-04 20:22:56.020695
33	49	qa-diagram-test-7443@example.com	e7ff650cfafe393af57901666777752aeeb28894c1e64418b418786e4f72a3be	verify	2026-07-05 21:22:20.229	f	2026-07-04 21:22:20.230449
34	50	qa_test_student_scholarhub@example.com	f95c4c43eb1c047f8974f0f15a6b26280ec04fea2fb27ae2b1460ce24532b9ba	verify	2026-07-06 08:28:23.978	f	2026-07-05 08:28:23.978969
35	53	qa_student_d29tsq@example.com	49004e26483b0980bc67d11d20c2db9a579120301726e4c688e21b080c4ab85a	verify	2026-07-06 08:51:56.937	f	2026-07-05 08:51:56.938282
37	54	john1783244539687@example.com	13a8c9bb618a4195b12bfdf9809e4e1996865a5144c75e74dacd34113e1a622e	verify	2026-07-06 09:45:42.033	f	2026-07-05 09:45:42.034097
38	56	vivatest-physio-2026@example.com	fc6fcdb9a57de19e0600b9e67d0c4f643f92de3db71796d86e763c033a90be20	verify	2026-07-06 10:06:33.059	f	2026-07-05 10:06:33.060176
39	57	vivatest-physio-books-2026@example.com	2d8b55e970055dff2a848176f7911243514280c39e7f6cce27fb8a335c519d68	verify	2026-07-06 10:13:40.86	f	2026-07-05 10:13:40.861396
40	58	vivatest-hema-images-2026@example.com	fbe294dcb4da982ce58eabe16ab79d9973f56cd748ac057d776414710d44d84b	verify	2026-07-06 10:18:12.734	f	2026-07-05 10:18:12.7358
41	59	vivatest-summary-2026@example.com	383d06c114598098b7a02ca36f1ff214d3adb4c685bd935df2e3ceb9d48f85ac	verify	2026-07-06 10:22:14.317	f	2026-07-05 10:22:14.318902
42	60	vivatest-bp-topic-2026@example.com	fb228d95c0fb52ad347295b6742a4bf871f940571bff7d7e489229c62e84b611	verify	2026-07-06 10:25:23.588	f	2026-07-05 10:25:23.589233
43	63	qa_viva_test@example.com	aa38185805ab5090fc84251afffb6ef7b2e790a99be2c4333e44cfe197b69295	verify	2026-07-06 11:23:22.463	f	2026-07-05 11:23:22.464279
44	64	qa_anatomy_test_6632@example.com	50d302d32f078ff2e73e2597446985d931037b66b84c6772f41ac74a3d6b7462	verify	2026-07-06 19:58:29.025	f	2026-07-05 19:58:29.026244
45	65	viva_qa_test_1783313290@example.com	44ba12184246320d7faae02e1e9304ad3246a266ca17a7ae495817cd2133bc6a	verify	2026-07-07 04:48:10.498	f	2026-07-06 04:48:10.499017
46	70	qa_e2e_verify_9182@example.com	787052896d136bdf62db02cb517be33da9467e0e10711f577c13ce78ee66bf30	verify	2026-07-07 20:24:33.653	f	2026-07-06 20:24:33.653773
47	71	qa_e2e_verify2_4471@example.com	a365217903db128652c7f7ab90ba66c062ed230369292b410004c7547253e63e	verify	2026-07-07 20:35:26.385	f	2026-07-06 20:35:26.38567
48	72	e2e_test_student@test.com	92cc680afd33c80ef905eb8e8b59a738c049f95d2153fcbf186008e8a826606a	verify	2026-07-08 15:20:45.173	f	2026-07-07 15:20:45.174362
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exams (id, user_id, title, subject, exam_date, description, is_global, created_at) FROM stdin;
1	28	Anatomy Practical QA	Anatomy	2026-07-19 14:59:00	\N	f	2026-06-19 14:59:29.062706
2	19	Pre MB exam	University	2026-07-06 08:00:00	Full syllabus of 1st Year	f	2026-06-20 09:43:00.943197
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, user_id, user_name, user_email, category, subject, message, rating, status, created_at, admin_reply, admin_reply_at) FROM stdin;
\.


--
-- Data for Name: flashcard_decks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flashcard_decks (id, user_id, subject, title, card_count, created_at, is_admin_shared) FROM stdin;
1	28	Anatomy	Test Deck QA	0	2026-06-19 14:58:41.550065	f
\.


--
-- Data for Name: flashcards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flashcards (id, deck_id, user_id, front, back, next_review, ease, "interval", repetitions, created_at) FROM stdin;
\.


--
-- Data for Name: grand_test_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grand_test_answers (id, submission_id, question_id, answer_text, ai_marks, ai_feedback, ai_key_points_covered, ai_key_points_missed, status, created_at, answer_image_url) FROM stdin;
\.


--
-- Data for Name: grand_test_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grand_test_questions (id, test_id, question_text, question_type, max_marks, order_index, model_answer, created_at) FROM stdin;
\.


--
-- Data for Name: grand_test_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grand_test_submissions (id, test_id, user_id, started_at, submitted_at, total_marks_obtained, total_marks_possible, status, ai_overall_feedback, created_at) FROM stdin;
\.


--
-- Data for Name: grand_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grand_tests (id, title, subject, description, duration_minutes, available_from, available_until, is_published, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: group_invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_invites (id, group_id, inviter_id, inviter_name, invitee_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_members (id, group_id, user_id, role, joined_at) FROM stdin;
1	4	24	owner	2026-06-17 07:10:37.065907
2	5	19	owner	2026-06-28 09:28:48.325888
\.


--
-- Data for Name: mnemonic_upvotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mnemonic_upvotes (id, user_id, mnemonic_id, created_at) FROM stdin;
\.


--
-- Data for Name: mnemonics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mnemonics (id, user_id, author_name, subject, topic, mnemonic, description, upvotes, created_at, is_admin_shared) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, title, subject, content, download_count, created_at, updated_at, created_by, file_url, file_type) FROM stdin;
\.


--
-- Data for Name: pdfs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pdfs (id, title, subject, professor, year, url, thumbnail_url, download_count, pages, size, created_at, created_by) FROM stdin;
2	Anatomy of Head and Neck Questions 	Anatomy	\N	1st Year	https://drive.google.com/file/d/1hfwuzxKey0gGZkX4gHnWCJwVmK2RGLdA/view?usp=drivesdk	\N	0	\N	\N	2026-06-15 10:49:36.712657	6
5	Biochemistry practical Spotting 	Biochemistry	\N	1st Year	https://drive.google.com/file/d/1SQWD8a0vo2_CAmEI-emKfULpz5KzF8EK/view?usp=drivesdk	\N	0	\N	\N	2026-06-15 10:51:07.035225	6
4	Anatomy of Thorax Questions	Anatomy	\N	1st Year	https://drive.google.com/file/d/1epmbrUdPlk16IHdfB5_MVlycMc8ka71y/view?usp=drivesdk	\N	1	\N	\N	2026-06-15 10:50:39.349331	6
6	Biochemistry Questions answer part 2	Biochemistry	\N	1st Year	https://drive.google.com/file/d/14Rk9S-LlKY3wLScxGMPSaH0nhrGSA2V_/view?usp=drivesdk	\N	1	\N	\N	2026-06-15 10:51:53.087432	6
1	Cadaveric Images - Heart	Anatomy	\N	1st Year	https://drive.google.com/file/d/1WL6NojJr25lcKI_QQ9w2o7Hj0lBi9rWr/view?usp=drivesdk	https://res.cloudinary.com/djhprpdkt/image/upload/v1781972068/mission-distinction/images/fzb1wwkhzu30dcfquyhv.jpg	0	\N	\N	2026-06-15 10:48:50.463014	6
3	Anatomy Short Questions	Anatomy	\N	1st Year	https://drive.google.com/file/d/1PWnBgA0M6SRwwluGeOhWZwuO-Dfrp6WZ/view?usp=drivesdk	https://res.cloudinary.com/djhprpdkt/image/upload/v1781972089/mission-distinction/images/crvvqgfiwuet53qrocux.jpg	0	\N	\N	2026-06-15 10:50:07.645015	6
\.


--
-- Data for Name: photo_doubts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.photo_doubts (id, user_id, image_url, question, ai_explanation, subject, created_at) FROM stdin;
\.


--
-- Data for Name: pinned_notices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pinned_notices (id, created_by, message, type, is_active, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_comments (id, post_id, user_id, author, author_avatar_url, content, created_at) FROM stdin;
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_likes (id, post_id, user_id, created_at, emoji) FROM stdin;
\.


--
-- Data for Name: proctoring_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proctoring_logs (id, session_id, user_id, quiz_id, attempt_id, event_type, details, ai_analysis, created_at) FROM stdin;
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) FROM stdin;
\.


--
-- Data for Name: pyq_insights_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pyq_insights_cache (id, user_id, insights_json, generated_at) FROM stdin;
\.


--
-- Data for Name: pyqs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pyqs (id, title, subject, year, url, download_count, created_by, created_at, college, topic_tags) FROM stdin;
\.


--
-- Data for Name: question_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_reports (id, user_id, question_id, quiz_id, reason, details, status, created_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions (id, quiz_id, text, options, correct_option, explanation, question_type, correct_answer, max_marks, model_answer, topic_tags) FROM stdin;
\.


--
-- Data for Name: quiz_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_answers (id, user_id, quiz_id, attempt_id, question_id, subject, question_type, correct, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_attempts (id, user_id, quiz_id, quiz_title, subject, score, total, percentage, created_at, has_pending, violation_count, is_flagged, proctoring_session_id, proctoring_flagged_at) FROM stdin;
\.


--
-- Data for Name: quiz_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_submissions (id, user_id, quiz_id, attempt_id, question_id, answer_text, answer_image_url, max_marks, ai_marks, ai_feedback, admin_marks, admin_feedback, status, created_at, graded_at, ai_lacking, admin_lacking) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quizzes (id, title, subject, description, question_count, difficulty, duration_minutes, is_featured, created_at, is_proctored) FROM stdin;
\.


--
-- Data for Name: rank_unlocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rank_unlocks (id, user_id, rank_name, level, xp_at_unlock, unlocked_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
2	6	5d0ab001-55f7-4581-a8c1-563849a986a0	2026-07-15 10:07:59.076	2026-06-15 10:07:59.076936
4	6	347f1328-ce0b-4ce4-8ae0-3272ce373ffe	2026-07-15 10:39:37.48	2026-06-15 10:39:37.481926
186	6	21f0df8d-dbee-4868-ab41-f4a7971a5845	2026-08-03 22:02:07.844	2026-07-04 22:02:07.845107
187	19	f247b5a7-f279-4007-bb27-dc708b71d997	2026-08-03 22:02:08.149	2026-07-04 22:02:08.149875
9	6	5be91cc8-6cda-4903-97a2-af7b5fd6c92c	2026-07-15 11:38:20.368	2026-06-15 11:38:20.369643
190	6	bb2c2d63-3498-4533-9b92-86bd99523a98	2026-08-04 08:06:55.362	2026-07-05 08:06:55.364699
192	6	460fe4be-4936-4329-8ccc-ecbdefb1d10e	2026-08-04 08:21:26.446	2026-07-05 08:21:26.447333
194	6	5bd307a2-e272-4931-9952-86cc872ceaa7	2026-08-04 08:25:09.696	2026-07-05 08:25:09.697251
13	6	ec1ac1ff-2734-42dc-8179-04e906530dd7	2026-07-15 15:36:30.656	2026-06-15 15:36:30.659184
14	6	913d326a-61d7-41e5-8f13-03f0676c41f9	2026-07-15 15:36:31.168	2026-06-15 15:36:31.169747
15	6	456a7e41-cf00-4924-a10b-ba1b54bf4a97	2026-07-15 15:36:31.497	2026-06-15 15:36:31.498393
16	6	10f93c6b-63e6-4203-96c8-926f624c3491	2026-07-15 15:36:32.217	2026-06-15 15:36:32.218699
17	6	14d8922d-8e5b-4610-9c04-ffe8bf342973	2026-07-15 15:36:33.482	2026-06-15 15:36:33.483244
18	6	5d94e9a5-6c3f-4d99-bd7a-8636ad5b6af4	2026-07-15 15:36:35.044	2026-06-15 15:36:35.045056
19	6	62d73eb2-ef06-4d28-8a0e-b7e4a389e390	2026-07-15 15:36:36.625	2026-06-15 15:36:36.626563
20	6	82588d2c-a365-4d3b-8ad4-0200631e4b70	2026-07-15 15:36:38.157	2026-06-15 15:36:38.158151
21	6	4525259d-e456-490e-bfa6-6970411405ee	2026-07-15 15:36:47.941	2026-06-15 15:36:47.942467
22	6	c5603ad5-c26b-459f-ac18-77d6b401022d	2026-07-15 15:36:49.754	2026-06-15 15:36:49.755698
23	6	e55e9b2a-2d19-4325-8fcd-a1c11a9282a7	2026-07-15 15:36:51.459	2026-06-15 15:36:51.460507
24	6	c05803ea-31d7-4d6a-a425-0e30796a3611	2026-07-15 15:36:53.265	2026-06-15 15:36:53.266937
25	6	bb4c6c7e-b340-4c1f-b84f-c41d8d5033e6	2026-07-15 15:47:31.408	2026-06-15 15:47:31.410701
26	6	bf56400c-f098-45da-9ad9-e95ecaa3f7af	2026-07-15 15:48:09.537	2026-06-15 15:48:09.538456
27	6	4d4a014f-8255-41e2-a894-3463d0945ca7	2026-07-15 15:48:23.477	2026-06-15 15:48:23.478737
28	6	a4d14074-702b-49fa-93a8-c94df1a8a1f4	2026-07-15 15:48:25.04	2026-06-15 15:48:25.041756
29	6	2e040a59-3e6f-4534-8f74-90b209b1ea67	2026-07-15 15:48:26.657	2026-06-15 15:48:26.658455
30	6	82b4fbff-a119-4113-9da3-4406d2733dc1	2026-07-15 15:48:28.182	2026-06-15 15:48:28.183297
31	6	0f0fd26e-057b-4d34-8871-6ba9b8ebdb1e	2026-07-15 15:48:29.697	2026-06-15 15:48:29.6979
32	6	86f23757-c30b-47f7-a40b-90ca88a5cc1f	2026-07-15 15:48:30.076	2026-06-15 15:48:30.077592
33	6	2521d649-bd3a-4af9-83ea-f4c3b402fe04	2026-07-15 15:48:31.58	2026-06-15 15:48:31.580786
34	6	69ccf948-ff49-4f7a-bdfd-d8bfa25e7e37	2026-07-15 15:48:33.123	2026-06-15 15:48:33.12423
35	6	d8bed583-89de-4707-9676-a5a8b55bf699	2026-07-15 15:48:34.733	2026-06-15 15:48:34.734432
36	6	1e8dfa76-458d-4ff5-a26e-d8b4beba2730	2026-07-15 15:48:36.262	2026-06-15 15:48:36.263548
37	6	37ce44d8-a5ac-4ed3-a5d9-8a9618f713f8	2026-07-15 15:48:37.798	2026-06-15 15:48:37.798761
38	6	9b170a79-4c44-4b9e-a0e8-c6722c4e7221	2026-07-15 15:48:39.338	2026-06-15 15:48:39.338655
39	6	eb65a867-4d61-45a9-9fc7-1e649ee1d71c	2026-07-15 15:48:40.961	2026-06-15 15:48:40.961601
40	6	d72bf68a-117d-4912-b679-970d832f1ff9	2026-07-15 15:48:42.519	2026-06-15 15:48:42.519617
41	6	f2a29fb7-ec05-416c-aed9-7ca5ef2bba85	2026-07-15 15:48:44.06	2026-06-15 15:48:44.061555
42	6	0c81a4bb-c627-41a2-9ce7-e56257457e08	2026-07-16 06:34:17.792	2026-06-16 06:34:17.793507
43	6	24fe825b-7ff8-49fc-ad66-3cfb984d18c0	2026-07-16 06:42:43.064	2026-06-16 06:42:43.068957
45	6	658f11f2-811d-4b07-9683-a0e7d69d3699	2026-07-16 06:42:43.454	2026-06-16 06:42:43.454644
47	6	3d6aa157-6391-4fba-9696-19668e2c3ce2	2026-07-16 06:42:44.896	2026-06-16 06:42:44.897213
198	6	8e5c8db8-4684-4215-a147-ddf2dffe3587	2026-08-04 08:29:29.85	2026-07-05 08:29:29.85093
49	6	8034b3fa-5934-40ee-ba93-2cafa20f25e5	2026-07-16 06:42:46.611	2026-06-16 06:42:46.613001
50	6	9ac5f370-420f-4ed2-85cc-e82994ac211c	2026-07-16 06:43:44.468	2026-06-16 06:43:44.469181
52	6	87bfc07c-4b01-45e9-8be8-ac05ef23519f	2026-07-16 06:43:45.976	2026-06-16 06:43:45.977506
202	53	538696af-2647-46c2-a4b9-e8863ba00f85	2026-08-04 08:51:57.649	2026-07-05 08:51:57.650606
54	6	1983afe9-6c63-4ccc-9f3b-8188b897030d	2026-07-16 06:43:46.312	2026-06-16 06:43:46.31262
55	6	097ab70a-413c-474f-802c-e87b063f0b4e	2026-07-17 03:34:27.113	2026-06-17 03:34:27.114122
56	19	1e849fbd-eaa1-4a03-83bb-958f7a51d8ae	2026-07-17 03:34:29.505	2026-06-17 03:34:29.50588
57	20	ee72ff7d-c21b-46ba-90e0-0474383e5442	2026-07-17 03:40:12.957	2026-06-17 03:40:12.958492
204	54	39601b48-7d91-451b-b6a5-201655f4ef97	2026-08-04 09:43:27.914	2026-07-05 09:43:27.916602
62	6	c4772051-47f8-4ea3-afe6-c6297c9f20bd	2026-07-17 07:22:01.03	2026-06-17 07:22:01.031855
64	6	63ab29e3-8493-4883-a3a7-8120d7a0d552	2026-07-17 07:22:25.276	2026-06-17 07:22:25.277311
65	6	586e9e1d-b22e-4e87-b344-b1d441669001	2026-07-17 07:22:34.035	2026-06-17 07:22:34.036767
66	6	61202360-a250-4e1f-ac24-2a5110b16972	2026-07-17 07:22:36.975	2026-06-17 07:22:36.975919
67	6	b04f1c05-3ed0-42bd-809d-0ed7c8bb8b50	2026-07-17 07:39:54.861	2026-06-17 07:39:54.863221
68	19	0374acce-ced0-41e1-a5cd-2a0bec7aabea	2026-07-18 09:12:46.367	2026-06-18 09:12:46.36909
70	19	d4e44d5c-8e98-452b-a173-69627c88a96c	2026-07-18 09:23:12.195	2026-06-18 09:23:12.196099
71	19	b6cc73bc-3efe-49f9-ad20-14d797e6aef5	2026-07-18 09:48:36.836	2026-06-18 09:48:36.837218
72	19	8e4371e6-a716-46cd-9e4f-777e5642df99	2026-07-18 10:16:02.043	2026-06-18 10:16:02.046365
73	19	dbed2c2c-a541-4374-9e49-eae32b3198db	2026-07-18 10:24:58.097	2026-06-18 10:24:58.099862
74	19	65826227-b5f5-4035-8c7e-385b62658e82	2026-07-18 10:27:35.59	2026-06-18 10:27:35.590949
75	19	cf180efb-9f3b-4570-a1d3-11c470728a4e	2026-07-18 10:28:19.54	2026-06-18 10:28:19.541051
220	6	fd805850-a3ac-483e-9b72-7353ae9eee91	2026-08-04 17:29:05.974	2026-07-05 17:29:05.975152
222	19	376d66d2-ec58-42c8-b73e-11566d87a756	2026-08-04 18:04:02.177	2026-07-05 18:04:02.187782
80	19	2bc93234-c4cf-4f37-bccb-caac70657af0	2026-07-19 15:39:27.75	2026-06-19 15:39:27.751994
81	19	d3edcc78-dbd4-4d1a-a7da-23e8269210ea	2026-07-19 15:43:42.361	2026-06-19 15:43:42.36197
82	19	8ef939d8-741f-450c-b042-d962bb3c69df	2026-07-19 16:29:25.898	2026-06-19 16:29:25.899632
83	19	2dfbf1c1-d4f9-43cb-a3e3-9ee5cb0b353b	2026-07-20 09:41:30.005	2026-06-20 09:41:30.006966
224	19	f3234626-5f4c-4c26-b4ad-7268d2df6a2d	2026-08-04 18:08:23.11	2026-07-05 18:08:23.112024
232	6	6d32d6ba-6645-4a9b-ba15-072dbb96e788	2026-08-04 19:52:31.995	2026-07-05 19:52:31.996938
236	19	f6247ef4-0d81-45aa-9b18-46874f35a76a	2026-08-05 04:51:43.503	2026-07-06 04:51:43.504925
237	19	fcc17dfc-ff5e-46d2-99bd-b726cdeb5a94	2026-08-05 04:51:51.218	2026-07-06 04:51:51.219742
88	19	f656055e-a5e1-4e71-b503-ff3f885903b0	2026-07-20 10:59:21.39	2026-06-20 10:59:21.39161
239	19	1013b1a4-ce71-4e5a-9f03-c01c8cc5f357	2026-08-05 06:37:09.056	2026-07-06 06:37:09.058304
241	19	856a9e9f-fa46-43cf-917e-fab9a406735f	2026-08-05 06:42:27.421	2026-07-06 06:42:27.422413
243	53	bf775164-dff5-4e6d-806f-1705598fa62e	2026-08-05 07:04:35.641	2026-07-06 07:04:35.642572
245	53	4f5a6ac9-2a44-4203-92db-583400ee10a1	2026-08-05 07:17:37.195	2026-07-06 07:17:37.196931
247	53	4cf89275-3409-4211-b46d-f7116d46218e	2026-08-05 07:29:39.7	2026-07-06 07:29:39.701793
249	53	b5431d84-d36b-49d0-9b05-9c0126d59b7d	2026-08-05 07:46:50.433	2026-07-06 07:46:50.434781
251	53	756143eb-aa54-450c-8c41-e579a8a5aaf8	2026-08-05 07:50:59.521	2026-07-06 07:50:59.522904
253	53	3fcfda4a-fe3e-48f7-888d-f439f3538b6a	2026-08-05 10:17:09.792	2026-07-06 10:17:09.79637
254	53	492d2b69-cba6-40e4-ac23-2dba435b3ac1	2026-08-05 10:17:10.054	2026-07-06 10:17:10.054614
257	6	23a3a95a-5d84-422e-85a3-ebc34f6d6267	2026-08-05 16:32:27.783	2026-07-06 16:32:27.785094
264	6	5032da2a-7a25-4c5f-b972-d1b1af0d82b8	2026-08-06 11:58:50.48	2026-07-07 11:58:50.481799
265	72	75ec141d-2733-4dd5-ac8e-90cc9fab7c42	2026-08-06 15:20:46.045	2026-07-07 15:20:46.046653
89	19	47ae4571-6297-465a-bb4f-691aff6f158e	2026-07-20 12:51:29.141	2026-06-20 12:51:29.1432
91	19	fd7dbf4b-1fa7-4842-86b1-ad8b31324d1a	2026-07-20 15:56:38.054	2026-06-20 15:56:38.05592
92	6	a229a179-1ad5-4b66-b165-ca309bc1b00a	2026-07-20 15:56:56.734	2026-06-20 15:56:56.735203
93	6	52bdaa9d-5c8d-4a90-8ae4-f6db37583ab3	2026-07-20 15:59:22.401	2026-06-20 15:59:22.402764
94	6	111838a8-88a9-42b8-9ade-cec09b3a9440	2026-07-20 16:01:42.144	2026-06-20 16:01:42.144949
95	6	41ea88f8-ec85-49a8-b0e4-ee866283ed02	2026-07-20 16:14:12.654	2026-06-20 16:14:12.655954
96	19	815fcc7e-9ebc-4ce3-a98c-a9f7e8eb88cb	2026-07-20 16:39:34.251	2026-06-20 16:39:34.255447
97	6	a4514d84-f7a3-4f6e-8b10-3788871fba8f	2026-07-20 16:40:12.824	2026-06-20 16:40:12.824888
98	6	95edb896-122f-4f20-a086-302cfdf5606e	2026-07-20 16:48:51.003	2026-06-20 16:48:51.006074
99	19	79dbe9d6-444f-4333-a836-7d9bf8c35f21	2026-07-26 04:38:04.284	2026-06-26 04:38:04.285056
100	19	df783db3-a718-45e2-86da-11842b7185af	2026-07-26 09:21:01.62	2026-06-26 09:21:01.621236
101	19	60ca6f66-eeeb-430c-8013-a65a4b4bf5cf	2026-07-26 09:25:09.373	2026-06-26 09:25:09.373584
102	19	bf57dab2-a3cb-4f6c-8846-8d9dfb7cf90a	2026-07-26 10:08:42.215	2026-06-26 10:08:42.216196
103	19	7d1d4d9c-d38e-4728-be91-d3daef470d59	2026-07-26 10:14:27.489	2026-06-26 10:14:27.490203
104	19	69a39854-4567-43ee-bfe4-371fbe804c42	2026-07-26 10:18:04.381	2026-06-26 10:18:04.382158
105	19	28e70f9a-8640-48c5-8af2-1aca5f4e67e8	2026-07-26 10:29:30.924	2026-06-26 10:29:30.924977
106	19	a3101710-969e-4cac-ac31-77d3da65f3e0	2026-07-26 10:30:47.595	2026-06-26 10:30:47.59646
107	19	01938ff9-e348-4efd-a277-a32565bf6420	2026-07-26 10:30:47.594	2026-06-26 10:30:47.595095
108	19	7b52d78b-7bdd-44ae-a53c-8b09ab4f016f	2026-07-26 10:30:47.596	2026-06-26 10:30:47.598395
109	19	0cf405d5-dec5-4ec1-a5c1-f351c2d0d963	2026-07-26 10:30:47.595	2026-06-26 10:30:47.598848
110	19	e69dcd55-8f8c-4231-8063-af0a08b555b0	2026-07-26 10:47:36.61	2026-06-26 10:47:36.610945
111	19	9e1f0f52-6351-4505-b551-d0bbeb26fe81	2026-07-26 10:53:45.595	2026-06-26 10:53:45.59616
112	19	fbca1f82-b3ae-4fdc-9532-f6a212e9eef7	2026-07-26 11:32:21.434	2026-06-26 11:32:21.435235
188	19	ba9e67f1-eea9-4a59-907e-3efccacb5e1e	2026-08-03 22:10:24.654	2026-07-04 22:10:24.655694
189	6	49e930ae-8586-4d14-962c-483564f1624f	2026-08-04 08:05:56.505	2026-07-05 08:05:56.506648
191	6	18334cff-2b05-4250-b614-68f10b43203d	2026-08-04 08:12:28.658	2026-07-05 08:12:28.660131
193	6	589a2f2f-2663-4c95-a1f8-de420dcaeca7	2026-08-04 08:23:43.567	2026-07-05 08:23:43.569763
128	30	3e209c73-b40c-418f-a602-cd9e8ed4176e	2026-07-28 15:29:31.564	2026-06-28 15:29:31.566177
129	30	a4a6fb9e-4d5f-4c05-83b8-0fdb2b7c9e48	2026-07-28 15:35:42.77	2026-06-28 15:35:42.771879
130	30	a9928c8f-97e9-4bc6-9ad8-539846a86f4c	2026-07-28 15:35:51.895	2026-06-28 15:35:51.89617
131	30	312716d3-2caa-4792-8df2-5d81e2ca2e02	2026-07-28 15:36:12.237	2026-06-28 15:36:12.237937
132	30	40c6988e-14ea-408d-a94c-5adf20b907e9	2026-07-28 15:36:27.169	2026-06-28 15:36:27.170109
133	30	fdf664b0-a1cb-42d7-8813-18bb4c1441ca	2026-07-28 15:37:29.845	2026-06-28 15:37:29.845966
219	6	7ea71dd5-5256-4420-9144-03eb9923692b	2026-08-04 17:19:09.778	2026-07-05 17:19:09.779662
138	6	7f9c43aa-f217-438a-90e4-bffcbec1310e	2026-07-31 02:11:32.081	2026-07-01 02:11:32.088634
139	6	5b8231e9-b59c-4b72-8c5c-3e7465945005	2026-07-31 02:15:56.041	2026-07-01 02:15:56.042079
140	6	7a6ba226-b2ed-40eb-a9ed-8d034d94dbd1	2026-07-31 02:16:11.321	2026-07-01 02:16:11.321736
141	6	1d434b71-f451-4974-ac17-2076fe149116	2026-07-31 02:19:03.562	2026-07-01 02:19:03.563941
142	6	9392a4b7-4e8a-40af-b300-628371cd4955	2026-07-31 02:32:55.996	2026-07-01 02:32:55.997348
143	6	391ac415-8bd4-4b07-8a64-c694ba038e77	2026-07-31 07:15:20.177	2026-07-01 07:15:20.178228
221	6	3b66f307-1bca-4d35-b553-7f2215113190	2026-08-04 17:34:39.168	2026-07-05 17:34:39.169192
145	6	022d05dd-d09d-4c6a-9262-741f6adcace0	2026-07-31 07:17:34.074	2026-07-01 07:17:34.075391
146	6	2556e3ea-1ba2-4a45-bd00-26e164cdc44f	2026-07-31 07:17:43.574	2026-07-01 07:17:43.575344
147	6	14641d76-a8b4-462e-866a-e0b31fdf4976	2026-07-31 07:18:26.28	2026-07-01 07:18:26.282051
223	19	a3f2e791-422d-4e8d-a5a7-8c73738f210a	2026-08-04 18:06:09.685	2026-07-05 18:06:09.686961
149	6	29d25846-20a2-4f7d-a4e6-4108abd6b430	2026-07-31 07:24:01.167	2026-07-01 07:24:01.168463
150	6	d47b3300-7a1b-444e-9be7-72a4a944d532	2026-07-31 07:24:40.376	2026-07-01 07:24:40.377517
151	6	fa0fab57-defc-49f8-bc96-d06389d0298f	2026-07-31 07:51:36.669	2026-07-01 07:51:36.670234
152	6	ebd27cec-20d3-4b95-b90e-95d935e48e27	2026-07-31 08:17:38.171	2026-07-01 08:17:38.172737
225	6	38b31ba5-1963-47fa-8655-293d2003ee55	2026-08-04 18:19:53.545	2026-07-05 18:19:53.546582
226	6	6b31f85a-4996-4ade-ae86-2f8a5192c64b	2026-08-04 19:08:10.316	2026-07-05 19:08:10.317324
227	6	711d8770-3389-48a6-94ca-8a1e6c510cd5	2026-08-04 19:08:17.915	2026-07-05 19:08:17.915713
228	6	5344e30e-c608-446b-8057-cee5a62711dd	2026-08-04 19:08:28.153	2026-07-05 19:08:28.154482
157	19	1b9dee39-1fba-4318-b508-e59553a04c1b	2026-07-31 09:13:33.14	2026-07-01 09:13:33.141914
229	6	25e2d80d-c25e-4be5-81e0-f539968b1f97	2026-08-04 19:08:48.002	2026-07-05 19:08:48.002697
230	6	2ee298d4-f2cb-4bed-bda1-ea9238ea1f7a	2026-08-04 19:09:06.692	2026-07-05 19:09:06.692649
231	6	ac8f1575-0be4-4386-8fbd-9f9ecb3b7da7	2026-08-04 19:09:22.205	2026-07-05 19:09:22.20631
233	64	461b2a70-19d9-449e-96a4-8704bb8b1392	2026-08-04 19:58:29.946	2026-07-05 19:58:29.946741
234	6	fd1d4000-f971-4ad9-abd0-73cb7c6e1c83	2026-08-04 20:05:37.647	2026-07-05 20:05:37.648362
238	19	46e4c347-efa0-45df-8442-a74f13a05401	2026-08-05 06:32:23.08	2026-07-06 06:32:23.082167
240	19	0b272d6c-8512-497c-8f0c-0337aad4d435	2026-08-05 06:39:22.231	2026-07-06 06:39:22.233011
242	53	0f0447fd-d8eb-4f90-a627-2b00f4725327	2026-08-05 06:50:32.281	2026-07-06 06:50:32.28301
244	53	9c8dc496-0ca4-425e-b9da-a26945b5a4d9	2026-08-05 07:07:32.329	2026-07-06 07:07:32.330319
246	53	1d7616de-99e4-491b-adde-a2878a019c88	2026-08-05 07:20:58.938	2026-07-06 07:20:58.939646
248	53	22102548-26e6-4d47-88d5-268aaff4e8f9	2026-08-05 07:34:43.974	2026-07-06 07:34:43.976412
250	53	73fd5695-ea3c-4fe8-9b8a-7d4fe2c28709	2026-08-05 07:47:12.708	2026-07-06 07:47:12.70896
252	53	556d8789-c1b2-4686-92a0-bfb41e65a57e	2026-08-05 10:10:27.448	2026-07-06 10:10:27.450276
255	53	b043f520-35d2-4241-ab6d-9d8d6806ffc2	2026-08-05 10:19:36.928	2026-07-06 10:19:36.929081
256	6	263a06a0-20cf-4545-8262-066abef06f76	2026-08-05 13:48:56.825	2026-07-06 13:48:56.826378
266	72	2a2c60c6-263f-48d7-8579-10ba2f6df314	2026-08-06 15:22:17.347	2026-07-07 15:22:17.354763
267	72	237b52f8-3f13-46c2-a647-87f9460affd9	2026-08-06 15:24:36.106	2026-07-07 15:24:36.107603
268	72	c79ab392-b060-4ce7-b1b8-408539527e6b	2026-08-06 15:28:43.108	2026-07-07 15:28:43.110342
269	72	0a3e0078-ab94-445b-8c3f-3e3a30660363	2026-08-06 15:29:01.248	2026-07-07 15:29:01.249609
270	72	a56d4dd3-23db-452f-8b9f-89249d445a92	2026-08-06 15:29:23.637	2026-07-07 15:29:23.638326
271	72	3aaae4d4-e3ee-4872-bee1-553dd24a5ca5	2026-08-06 15:29:26.512	2026-07-07 15:29:26.513069
272	72	0843476a-32d1-4501-985f-680af20ab5dc	2026-08-07 09:28:10.878	2026-07-08 09:28:10.880997
273	72	b78a5a51-7996-49e3-afc1-d7427efc4601	2026-08-07 09:29:54.469	2026-07-08 09:29:54.470548
274	72	b14d7b81-c9ce-443b-baea-19a6b8665cb1	2026-08-07 09:31:22.769	2026-07-08 09:31:22.770824
276	72	7efb385e-d566-4c7e-82c8-8aa7a186e604	2026-08-07 17:17:18.134	2026-07-08 17:17:18.136038
277	72	3959e096-2600-4b1c-8c99-a42864f83436	2026-08-07 17:17:34.026	2026-07-08 17:17:34.044061
278	72	d4d628ae-a4e1-4028-8340-02a02e1fc597	2026-08-07 17:21:51.204	2026-07-08 17:21:51.205692
279	72	4cb3d868-7b7a-4e56-928a-ffb0104b4341	2026-08-07 17:24:26.057	2026-07-08 17:24:26.058856
280	6	57df472c-a6aa-47d5-9d2a-070bba2504ae	2026-08-07 17:33:14.122	2026-07-08 17:33:14.123799
281	72	e3344671-7eb4-4e2d-90cf-2615d1ea86cd	2026-08-10 09:22:39.065	2026-07-11 09:22:39.066885
282	72	db6ad2da-d18c-4f66-9243-52edd85362be	2026-08-10 09:25:30.901	2026-07-11 09:25:30.902245
283	72	9902b815-ea42-48ea-b5f4-db9ba8c39769	2026-08-10 09:30:20.277	2026-07-11 09:30:20.278386
284	72	c9122ad6-f02d-4e2d-82ba-c871fbb68409	2026-08-10 09:32:55.206	2026-07-11 09:32:55.215248
285	72	2ed4cfd9-b5ad-46bc-9dde-f27ae5deaa15	2026-08-10 09:32:58.673	2026-07-11 09:32:58.675464
286	72	c5166063-a351-41cb-93f0-5129e229a676	2026-08-10 09:33:11.967	2026-07-11 09:33:11.969534
287	72	fa949b86-0fd7-452d-a209-50bab9ea5925	2026-08-10 09:33:15.853	2026-07-11 09:33:15.854695
289	19	e3eb9d23-062c-449e-991a-8eeb9d50d730	2026-08-14 09:51:58.961	2026-07-15 09:51:58.962628
\.


--
-- Data for Name: student_note_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_note_submissions (id, user_id, title, subject, description, file_url, file_type, status, admin_note, reviewed_by, reviewed_at, xp_awarded, created_at) FROM stdin;
\.


--
-- Data for Name: student_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_submissions (id, user_id, user_name, user_college, type, title, subject, year, url, description, status, reviewed_by, reviewed_by_name, rejection_reason, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: student_warnings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_warnings (id, user_id, issued_by, issued_by_name, reason, severity, seen_at, created_at) FROM stdin;
\.


--
-- Data for Name: study_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_plans (id, user_id, target_date, plan_json, weak_subjects, generated_at) FROM stdin;
1	45	\N	{"days": [{"day": "Day 1 - Tue", "focus": "Anatomy", "tasks": ["Revise Upper Limb Anatomy - 45 min", "Draw and label the Brachial Plexus - 30 min", "Watch a video on the Anatomy of the Shoulder - 30 min"]}, {"day": "Day 2 - Wed", "focus": "Physiology", "tasks": ["Revise Cardiac Cycle - 45 min", "Attempt 10 MCQs on Cardiovascular Physiology - 30 min", "Discuss Cardiac Output with a study partner - 30 min"]}, {"day": "Day 3 - Thu", "focus": "Biochemistry", "tasks": ["Revise Metabolism of Carbohydrates - 45 min", "Create a flowchart for Glycolysis - 30 min", "Attempt 10 MCQs on Biochemical Pathways - 30 min"]}, {"day": "Day 4 - Fri", "focus": "Anatomy", "tasks": ["Revise Lower Limb Anatomy - 45 min", "Draw and label the Femoral Triangle - 30 min", "Watch a video on the Anatomy of the Hip Joint - 30 min"]}, {"day": "Day 5 - Sat", "focus": "Physiology", "tasks": ["Revise Respiratory Physiology - 45 min", "Attempt 10 MCQs on Respiratory System - 30 min", "Review the Mechanism of Breathing with diagrams - 30 min"]}, {"day": "Day 6 - Sun", "focus": "Biochemistry", "tasks": ["Revise Enzyme Kinetics - 45 min", "Create a summary sheet for Enzyme Regulation - 30 min", "Attempt 10 MCQs on Enzymes - 30 min"]}, {"day": "Day 7 - Mon", "focus": "Integrated Revision", "tasks": ["Revise key concepts from Anatomy, Physiology, and Biochemistry - 1 hour", "Attempt 20 mixed MCQs covering all three subjects - 1 hour", "Discuss challenging topics with peers - 30 min"]}], "summary": "You've got a great opportunity to solidify your understanding of the foundational subjects in your MBBS journey. Let's make the most of this week with focused study sessions to boost your confidence and performance in the upcoming exams!"}	[]	2026-07-04 20:03:38.054069
\.


--
-- Data for Name: study_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_room_members (id, room_id, user_id, user_name, last_heartbeat, created_at) FROM stdin;
1	1	28	Anonymous	2026-06-19 15:01:41.572	2026-06-19 15:01:41.528889
4	2	19	Anonymous	2026-06-26 14:52:07.741	2026-06-26 14:51:47.636312
\.


--
-- Data for Name: study_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_rooms (id, host_id, host_name, name, subject, timer_minutes, status, started_at, ends_at, member_count, created_at, cohort_year, cohort_session_year) FROM stdin;
2	19	Anonymous	Vvbbb	Anatomy	25	waiting	\N	\N	1	2026-06-26 14:51:47.630882	\N	\N
\.


--
-- Data for Name: study_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_sessions (id, user_id, subject, duration_minutes, session_type, created_at) FROM stdin;
\.


--
-- Data for Name: teach_back_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teach_back_sessions (id, user_id, topic, subject, transcript, score, feedback_json, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, email, mobile_number, password_hash, role, year, college, avatar_url, study_streak, created_at, email_verified, last_streak_date, is_super_admin, banned_at, ban_reason, total_xp, current_rank, session_year, last_seen_app_update_at, weekly_digest_opt_in, linked_student_id) FROM stdin;
54	John Doe	john1783244539687@example.com	\N	$2b$12$G/XtqeNlDBRigu/52MZkbe6RhKLpYYA2wR7wfKDI75SeL0qs0DAPC	student	1st Year	AIIMS Bhubaneswar	\N	1	2026-07-05 09:43:26.837666	f	2026-07-05	f	\N	\N	0	1	2025-26	2026-07-05 09:43:26.837666	f	\N
64	Test Student QA	qa_anatomy_test_6632@example.com	9999999999	$2b$12$qaRsg5SqyjENdWiqdIWnjuzL2iIxjSJfWGXlYhn5Zau2fZnzmc4B.	student	1st Year	AIIMS Bhubaneswar	\N	1	2026-07-05 19:58:29.009593	f	2026-07-06	f	\N	\N	0	1	2025-26	2026-07-05 19:58:29.009593	f	\N
53	QA Test Student D29tSQ	qa_student_d29tsq@example.com	\N	$2b$10$l6dq819.kdCQVCs5kX5lLeHisyOmb8VvkvprN2XsspVe7k44ShB/W	student	1st Year	AIIMS Bhubaneswar	\N	2	2026-07-05 08:51:56.843008	f	2026-07-06	f	\N	\N	20	1	2025-26	2026-07-05 08:51:56.843008	f	\N
20	DMonster15	dbfactifier@gmail.com	\N	$2b$12$55XSHQG2i9ScsOWBKuq2buiDXUXwKTMPbTjPEK.SaLO3d0WIdjGXy	student	1st Year	VSS Institute of Medical Sciences & Research (VIMSAR), Burla	\N	0	2026-06-17 03:40:12.060325	f	\N	f	\N	\N	0	1	\N	2026-07-04 19:23:40.116751	f	\N
30	AuditUser 7vsnzt	audit_7vsnzt@test.com	9000000000	$2b$12$LbWaWBhpGNgXg8/Gi3ZYDOywSSFYuui0yU4E2VV5IU4m26Fq/oW66	student	1st	AIIMS Bhubaneswar	\N	0	2026-06-28 15:29:30.768794	f	\N	f	\N	\N	0	1	\N	2026-07-04 19:23:40.116751	f	\N
72	Test Student E2E	e2e_test_student@test.com	\N	$2b$10$F4K2CB21lQMFXxdv3retS.1sNhrgUWrqQHPZuFnHYLRXRMEqW3F1O	student	1st Year	AIIMS Bhubaneswar	\N	2	2026-07-07 15:20:45.06739	t	2026-07-08	f	\N	\N	0	1	2025-26	2026-07-07 15:20:45.06739	f	\N
6	Mission Distinction	missiondistinction108@gmail.com	\N	$2b$12$GRz179LHT.xKxA0pJXznMuiq.BJPCZDwz5qgQbbejK21nCgzQuIlS	admin	1st Year	AIIMS Bhubaneswar	https://missiondistinction.replit.app/api/upload/avatar/avatar_6_mastermind.png	1	2026-06-13 10:34:03.026758	t	2026-07-06	t	\N	\N	0	1	2025-26	2026-07-04 19:23:40.116751	f	19
19	Jk	www.jyotirmay1234@gmail.com	\N	$2b$10$X1UuJjpcAhG96aOextnneOWS2mDu1yuxRSSDvMxcvUuvtnBYRMv8y	student	1st Year	VSS Institute of Medical Sciences & Research (VIMSAR), Burla	https://fb280449-f988-4beb-8143-6ae1a9442933-00-1sak3l4a1tn4m.sisko.replit.dev/api/upload/avatar/avatar_19_1782465688982.jpg	1	2026-06-17 03:34:27.670083	t	2026-07-15	f	\N	\N	0	1	2025-26	2026-07-04 19:23:40.116751	f	\N
\.


--
-- Data for Name: viva_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.viva_history (id, user_id, subject, viva_type, image_id, score, created_at) FROM stdin;
\.


--
-- Data for Name: viva_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.viva_room_members (id, room_id, user_id, user_name, last_heartbeat, created_at) FROM stdin;
\.


--
-- Data for Name: viva_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.viva_rooms (id, host_id, host_name, name, subject, member_count, created_at) FROM stdin;
\.


--
-- Data for Name: viva_source_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.viva_source_documents (id, subject, file_name, full_text, char_count, pages, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: viva_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.viva_sources (id, subject, source_text, updated_by, updated_at) FROM stdin;
1	Anatomy	Focus on brachial plexus and femoral triangle this term.	6	2026-07-05 08:06:36.557091
\.


--
-- Data for Name: xp_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.xp_transactions (id, user_id, amount, type, description, created_at) FROM stdin;
3	30	8	community_post	Posted in community: Audit test	2026-06-28 15:36:12.470553
5	45	10	pyq_read_1	Opened PYQ: Anatomy VIMSAR 2023 Sample	2026-07-04 20:07:10.141292
6	46	10	pyq_read_1	Opened PYQ: Anatomy VIMSAR 2023 Sample	2026-07-04 20:14:26.459431
7	47	10	pyq_read_1	Opened PYQ: Anatomy VIMSAR 2023 Sample	2026-07-04 20:19:22.547691
9	53	20	viva_complete	Completed Physiology viva	2026-07-06 10:17:19.799615
10	73	20	doubt_asked	Asked a doubt: Test cohort isolation	2026-07-08 09:45:18.99043
\.


--
-- Name: activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_id_seq', 2, true);


--
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_chat_sessions_id_seq', 1, true);


--
-- Name: ai_revision_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_revision_items_id_seq', 1, false);


--
-- Name: anatomy_viva_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anatomy_viva_images_id_seq', 1015, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcements_id_seq', 4, true);


--
-- Name: app_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_updates_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 2, true);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookmarks_id_seq', 1, false);


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.books_id_seq', 2, true);


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 1, false);


--
-- Name: clinical_case_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinical_case_attempts_id_seq', 1, false);


--
-- Name: clinical_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinical_cases_id_seq', 75, true);


--
-- Name: community_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_groups_id_seq', 5, true);


--
-- Name: community_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_messages_id_seq', 1, true);


--
-- Name: community_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.community_posts_id_seq', 1, true);


--
-- Name: confession_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.confession_likes_id_seq', 1, true);


--
-- Name: confessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.confessions_id_seq', 1, true);


--
-- Name: content_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.content_reports_id_seq', 1, false);


--
-- Name: daily_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_questions_id_seq', 24, true);


--
-- Name: device_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_events_id_seq', 135, true);


--
-- Name: doubt_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.doubt_answers_id_seq', 1, true);


--
-- Name: doubts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.doubts_id_seq', 2, true);


--
-- Name: email_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_tokens_id_seq', 48, true);


--
-- Name: exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exams_id_seq', 2, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_id_seq', 1, false);


--
-- Name: flashcard_decks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flashcard_decks_id_seq', 1, true);


--
-- Name: flashcards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flashcards_id_seq', 1, false);


--
-- Name: grand_test_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grand_test_answers_id_seq', 1, false);


--
-- Name: grand_test_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grand_test_questions_id_seq', 1, false);


--
-- Name: grand_test_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grand_test_submissions_id_seq', 1, false);


--
-- Name: grand_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grand_tests_id_seq', 1, false);


--
-- Name: group_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_invites_id_seq', 1, false);


--
-- Name: group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_members_id_seq', 2, true);


--
-- Name: mnemonic_upvotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mnemonic_upvotes_id_seq', 1, false);


--
-- Name: mnemonics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mnemonics_id_seq', 1, false);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notes_id_seq', 3, true);


--
-- Name: pdfs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pdfs_id_seq', 7, true);


--
-- Name: photo_doubts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.photo_doubts_id_seq', 1, false);


--
-- Name: pinned_notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pinned_notices_id_seq', 1, false);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 1, true);


--
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.post_likes_id_seq', 1, true);


--
-- Name: proctoring_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proctoring_logs_id_seq', 1, false);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, true);


--
-- Name: pyq_insights_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pyq_insights_cache_id_seq', 1, false);


--
-- Name: pyqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pyqs_id_seq', 2, true);


--
-- Name: question_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.question_reports_id_seq', 1, false);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, false);


--
-- Name: quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_answers_id_seq', 1, false);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_attempts_id_seq', 1, false);


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_submissions_id_seq', 1, false);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: rank_unlocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rank_unlocks_id_seq', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 289, true);


--
-- Name: student_note_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_note_submissions_id_seq', 1, false);


--
-- Name: student_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_submissions_id_seq', 2, true);


--
-- Name: student_warnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_warnings_id_seq', 1, false);


--
-- Name: study_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.study_plans_id_seq', 1, true);


--
-- Name: study_room_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.study_room_members_id_seq', 4, true);


--
-- Name: study_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.study_rooms_id_seq', 2, true);


--
-- Name: study_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.study_sessions_id_seq', 1, false);


--
-- Name: teach_back_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teach_back_sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 73, true);


--
-- Name: viva_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.viva_history_id_seq', 1, false);


--
-- Name: viva_room_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.viva_room_members_id_seq', 1, true);


--
-- Name: viva_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.viva_rooms_id_seq', 1, true);


--
-- Name: viva_source_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.viva_source_documents_id_seq', 16, true);


--
-- Name: viva_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.viva_sources_id_seq', 1, true);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.xp_transactions_id_seq', 10, true);


--
-- Name: activity activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_revision_items ai_revision_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_revision_items
    ADD CONSTRAINT ai_revision_items_pkey PRIMARY KEY (id);


--
-- Name: anatomy_viva_images anatomy_viva_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomy_viva_images
    ADD CONSTRAINT anatomy_viva_images_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: app_updates app_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_updates
    ADD CONSTRAINT app_updates_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: clinical_case_attempts clinical_case_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_case_attempts
    ADD CONSTRAINT clinical_case_attempts_pkey PRIMARY KEY (id);


--
-- Name: clinical_cases clinical_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_cases
    ADD CONSTRAINT clinical_cases_pkey PRIMARY KEY (id);


--
-- Name: community_groups community_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_groups
    ADD CONSTRAINT community_groups_pkey PRIMARY KEY (id);


--
-- Name: community_messages community_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_messages
    ADD CONSTRAINT community_messages_pkey PRIMARY KEY (id);


--
-- Name: community_posts community_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_pkey PRIMARY KEY (id);


--
-- Name: confession_likes confession_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confession_likes
    ADD CONSTRAINT confession_likes_pkey PRIMARY KEY (id);


--
-- Name: confessions confessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.confessions
    ADD CONSTRAINT confessions_pkey PRIMARY KEY (id);


--
-- Name: content_reports content_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_pkey PRIMARY KEY (id);


--
-- Name: daily_questions daily_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_questions
    ADD CONSTRAINT daily_questions_pkey PRIMARY KEY (id);


--
-- Name: device_events device_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_events
    ADD CONSTRAINT device_events_pkey PRIMARY KEY (id);


--
-- Name: doubt_answers doubt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answers
    ADD CONSTRAINT doubt_answers_pkey PRIMARY KEY (id);


--
-- Name: doubts doubts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubts
    ADD CONSTRAINT doubts_pkey PRIMARY KEY (id);


--
-- Name: email_tokens email_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT email_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_tokens email_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT email_tokens_token_unique UNIQUE (token);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: flashcard_decks flashcard_decks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcard_decks
    ADD CONSTRAINT flashcard_decks_pkey PRIMARY KEY (id);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: grand_test_answers grand_test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_answers
    ADD CONSTRAINT grand_test_answers_pkey PRIMARY KEY (id);


--
-- Name: grand_test_questions grand_test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_questions
    ADD CONSTRAINT grand_test_questions_pkey PRIMARY KEY (id);


--
-- Name: grand_test_submissions grand_test_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_submissions
    ADD CONSTRAINT grand_test_submissions_pkey PRIMARY KEY (id);


--
-- Name: grand_tests grand_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_tests
    ADD CONSTRAINT grand_tests_pkey PRIMARY KEY (id);


--
-- Name: group_invites group_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: mnemonic_upvotes mnemonic_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mnemonic_upvotes
    ADD CONSTRAINT mnemonic_upvotes_pkey PRIMARY KEY (id);


--
-- Name: mnemonics mnemonics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mnemonics
    ADD CONSTRAINT mnemonics_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: pdfs pdfs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdfs
    ADD CONSTRAINT pdfs_pkey PRIMARY KEY (id);


--
-- Name: photo_doubts photo_doubts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_doubts
    ADD CONSTRAINT photo_doubts_pkey PRIMARY KEY (id);


--
-- Name: pinned_notices pinned_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_notices
    ADD CONSTRAINT pinned_notices_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: proctoring_logs proctoring_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_logs
    ADD CONSTRAINT proctoring_logs_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: pyq_insights_cache pyq_insights_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pyq_insights_cache
    ADD CONSTRAINT pyq_insights_cache_pkey PRIMARY KEY (id);


--
-- Name: pyq_insights_cache pyq_insights_cache_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pyq_insights_cache
    ADD CONSTRAINT pyq_insights_cache_user_id_unique UNIQUE (user_id);


--
-- Name: pyqs pyqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pyqs
    ADD CONSTRAINT pyqs_pkey PRIMARY KEY (id);


--
-- Name: question_reports question_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_reports
    ADD CONSTRAINT question_reports_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: rank_unlocks rank_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rank_unlocks
    ADD CONSTRAINT rank_unlocks_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: student_note_submissions student_note_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_note_submissions
    ADD CONSTRAINT student_note_submissions_pkey PRIMARY KEY (id);


--
-- Name: student_submissions student_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_submissions
    ADD CONSTRAINT student_submissions_pkey PRIMARY KEY (id);


--
-- Name: student_warnings student_warnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_warnings
    ADD CONSTRAINT student_warnings_pkey PRIMARY KEY (id);


--
-- Name: study_plans study_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_plans
    ADD CONSTRAINT study_plans_pkey PRIMARY KEY (id);


--
-- Name: study_room_members study_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_room_members
    ADD CONSTRAINT study_room_members_pkey PRIMARY KEY (id);


--
-- Name: study_rooms study_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_rooms
    ADD CONSTRAINT study_rooms_pkey PRIMARY KEY (id);


--
-- Name: study_sessions study_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_pkey PRIMARY KEY (id);


--
-- Name: teach_back_sessions teach_back_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teach_back_sessions
    ADD CONSTRAINT teach_back_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: viva_history viva_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_history
    ADD CONSTRAINT viva_history_pkey PRIMARY KEY (id);


--
-- Name: viva_room_members viva_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_room_members
    ADD CONSTRAINT viva_room_members_pkey PRIMARY KEY (id);


--
-- Name: viva_rooms viva_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_rooms
    ADD CONSTRAINT viva_rooms_pkey PRIMARY KEY (id);


--
-- Name: viva_source_documents viva_source_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_source_documents
    ADD CONSTRAINT viva_source_documents_pkey PRIMARY KEY (id);


--
-- Name: viva_sources viva_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_sources
    ADD CONSTRAINT viva_sources_pkey PRIMARY KEY (id);


--
-- Name: viva_sources viva_sources_subject_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_sources
    ADD CONSTRAINT viva_sources_subject_unique UNIQUE (subject);


--
-- Name: xp_transactions xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_pkey PRIMARY KEY (id);


--
-- Name: clinical_case_attempts_user_case_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clinical_case_attempts_user_case_date ON public.clinical_case_attempts USING btree (user_id, case_id, date_key);


--
-- Name: confession_likes_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX confession_likes_unique ON public.confession_likes USING btree (user_id, confession_id);


--
-- Name: content_reports_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_reports_unique ON public.content_reports USING btree (reporter_id, content_type, content_id);


--
-- Name: daily_questions_user_date_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX daily_questions_user_date_unique ON public.daily_questions USING btree (user_id, date_key);


--
-- Name: group_invites_pending_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX group_invites_pending_unique ON public.group_invites USING btree (group_id, invitee_id) WHERE (status = 'pending'::text);


--
-- Name: group_members_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX group_members_unique ON public.group_members USING btree (group_id, user_id);


--
-- Name: idx_ai_chat_sessions_user_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_user_updated ON public.ai_chat_sessions USING btree (user_id, updated_at DESC);


--
-- Name: idx_ai_revision_items_book_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_revision_items_book_id ON public.ai_revision_items USING btree (book_id);


--
-- Name: idx_ai_revision_items_subject_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_revision_items_subject_type ON public.ai_revision_items USING btree (subject, type);


--
-- Name: idx_gta_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gta_submission ON public.grand_test_answers USING btree (submission_id);


--
-- Name: idx_gtq_test_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gtq_test_id ON public.grand_test_questions USING btree (test_id, order_index);


--
-- Name: idx_gts_test_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gts_test_user ON public.grand_test_submissions USING btree (test_id, user_id);


--
-- Name: idx_gts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gts_user ON public.grand_test_submissions USING btree (user_id);


--
-- Name: idx_pd_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pd_user ON public.photo_doubts USING btree (user_id);


--
-- Name: idx_sns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sns_status ON public.student_note_submissions USING btree (status);


--
-- Name: idx_sns_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sns_user ON public.student_note_submissions USING btree (user_id);


--
-- Name: mnemonic_upvotes_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mnemonic_upvotes_unique ON public.mnemonic_upvotes USING btree (user_id, mnemonic_id);


--
-- Name: post_likes_post_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX post_likes_post_user_idx ON public.post_likes USING btree (post_id, user_id);


--
-- Name: proctoring_logs_attempt_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proctoring_logs_attempt_id ON public.proctoring_logs USING btree (attempt_id);


--
-- Name: proctoring_logs_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proctoring_logs_session_id ON public.proctoring_logs USING btree (session_id);


--
-- Name: quiz_answers_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_answers_user_idx ON public.quiz_answers USING btree (user_id);


--
-- Name: quiz_answers_user_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_answers_user_subject_idx ON public.quiz_answers USING btree (user_id, subject);


--
-- Name: quiz_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_submissions_status ON public.quiz_submissions USING btree (status);


--
-- Name: quiz_submissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_submissions_user_id ON public.quiz_submissions USING btree (user_id);


--
-- Name: rank_unlocks_user_level; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX rank_unlocks_user_level ON public.rank_unlocks USING btree (user_id, level);


--
-- Name: study_plans_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX study_plans_user_idx ON public.study_plans USING btree (user_id);


--
-- Name: study_room_members_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX study_room_members_unique ON public.study_room_members USING btree (room_id, user_id);


--
-- Name: xp_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX xp_transactions_user_id ON public.xp_transactions USING btree (user_id);


--
-- Name: grand_test_answers grand_test_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_answers
    ADD CONSTRAINT grand_test_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.grand_test_questions(id) ON DELETE CASCADE;


--
-- Name: grand_test_answers grand_test_answers_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_answers
    ADD CONSTRAINT grand_test_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.grand_test_submissions(id) ON DELETE CASCADE;


--
-- Name: grand_test_questions grand_test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_questions
    ADD CONSTRAINT grand_test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.grand_tests(id) ON DELETE CASCADE;


--
-- Name: grand_test_submissions grand_test_submissions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grand_test_submissions
    ADD CONSTRAINT grand_test_submissions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.grand_tests(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_linked_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_linked_student_id_fkey FOREIGN KEY (linked_student_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict CVT5fhCUdHQZKEQuAbbuNwgZvsIRZJtJdHYIsL0nsMPaeoV0fU6novdphLv8Xhh

