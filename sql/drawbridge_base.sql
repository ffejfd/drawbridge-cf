-- phpMyAdmin SQL Dump
-- version 3.3.2deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 29, 2010 at 02:16 AM
-- Server version: 5.1.41
-- PHP Version: 5.3.2-1ubuntu4.2

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `sketch_salad`
--

-- --------------------------------------------------------

--
-- Table structure for table `segment`
--

DROP TABLE IF EXISTS `segment`;
CREATE TABLE `segment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `color` varchar(7) NOT NULL DEFAULT '#000000',
  `points` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `sketch`
--

DROP TABLE IF EXISTS `sketch`;
CREATE TABLE `sketch` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `hash` varchar(40) NOT NULL,
  `parent_id` varchar(40) DEFAULT NULL,
  `root_id` varchar(40) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `hash` (`hash`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;
INSERT INTO sketch(hash, parent_id, root_id) VALUES ("public","public","public");
INSERT INTO sketch(hash, parent_id, root_id) VALUES ("404","404","404");

-- --------------------------------------------------------

--
-- Table structure for table `saved_sketch`
--
DROP TABLE IF EXISTS `saved_sketch`;
CREATE TABLE `saved_sketch` (
    `key` VARCHAR( 40 ) NOT NULL ,
    `data` TEXT NOT NULL ,
    PRIMARY KEY (  `key` )
) ENGINE = MYISAM;
INSERT INTO saved_sketch(`key`, data) VALUES ("404", "data:image/png;base64,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");

-- --------------------------------------------------------

--
-- Table structure for table `sketch_to_segment`
--

DROP TABLE IF EXISTS `sketch_to_segment`;
CREATE TABLE `sketch_to_segment` (
  `sketch_id` bigint(20) NOT NULL,
  `segment_id` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `email` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_to_sketch`
--

DROP TABLE IF EXISTS `user_to_sketch`;
CREATE TABLE `user_to_sketch` (
  `user_id` bigint(20) NOT NULL,
  `sketch_id` bigint(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
